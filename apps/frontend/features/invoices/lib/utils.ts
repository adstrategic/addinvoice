import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { DiscountType, TaxMode } from "../types/api";
import type {
  InvoiceResponse,
  InvoiceItemResponse,
  InvoiceItemCreateInput,
} from "../schemas/invoice.schema";

/**
 * Calculate item total with tax
 */
export function calculateItemTotal(item: InvoiceItemResponse): number {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = (subtotal * item.tax) / 100;
  return subtotal + taxAmount;
}

interface InvoiceDraftTotalsInput {
  discount: number;
  discountType: DiscountType;
  taxMode: TaxMode;
  taxPercentage: number | null;
}

export function calculateDraftInvoiceTotals(
  invoice: InvoiceDraftTotalsInput,
  items: InvoiceItemCreateInput[],
): {
  subtotal: number;
  total: number;
  totalTax: number;
} {
  const itemTotals = items.map((item) => {
    const baseAmount = item.quantity * item.unitPrice;
    let itemTotalAfterDiscount = baseAmount;

    if (item.discountType === "PERCENTAGE") {
      itemTotalAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
    } else if (item.discountType === "FIXED") {
      itemTotalAfterDiscount = baseAmount - item.discount;
    }

    return itemTotalAfterDiscount;
  });

  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

  let subtotalAfterDiscount = subtotal;
  if (invoice.discountType === "PERCENTAGE") {
    subtotalAfterDiscount = subtotal - (subtotal * invoice.discount) / 100;
  } else if (invoice.discountType === "FIXED") {
    subtotalAfterDiscount = subtotal - invoice.discount;
  }

  let totalTax = 0;
  if (subtotal !== 0) {
    const ratio = subtotalAfterDiscount / subtotal;

    if (invoice.taxMode === "BY_PRODUCT") {
      totalTax = items.reduce((sum, item, index) => {
        const itemTaxableAfterDiscount = (itemTotals[index] ?? 0) * ratio;
        return sum + (itemTaxableAfterDiscount * (item.tax ?? 0)) / 100;
      }, 0);
    } else if (invoice.taxMode === "BY_TOTAL" && invoice.taxPercentage) {
      const taxableSubtotal = items.reduce(
        (sum, item, index) =>
          item.vatEnabled ? sum + (itemTotals[index] ?? 0) : sum,
        0,
      );
      const taxableAfterDiscount = taxableSubtotal * ratio;
      totalTax = (taxableAfterDiscount * invoice.taxPercentage) / 100;
    }
  }

  return {
    subtotal,
    total: subtotalAfterDiscount + totalTax,
    totalTax,
  };
}

/**
 * Generate PDF from invoice preview element
 */
export async function generateInvoicePDF(
  invoice: InvoiceResponse,
  previewElementId: string,
): Promise<void> {
  const previewElement = document.getElementById(previewElementId);
  if (!previewElement) {
    throw new Error("Invoice preview element not found");
  }

  const canvas = await html2canvas(previewElement, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  const clientName =
    invoice.client?.name || invoice.client?.businessName || "Client";
  const invoiceDate = invoice.issueDate || "date";
  pdf.save(`Invoice-${clientName}-${invoiceDate}.pdf`);
}
