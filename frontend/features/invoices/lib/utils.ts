import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { InvoiceResponse, InvoiceItemResponse } from "../types/api";
import { CreateInvoiceDTO } from "../schemas/invoice.schema";

/**
 * Calculate item total with tax
 */
export function calculateItemTotal(item: InvoiceItemResponse): number {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = (subtotal * item.tax) / 100;
  return subtotal + taxAmount;
}

/**
 * Generate PDF from invoice preview element
 */
export async function generateInvoicePDF(
  invoice: InvoiceResponse,
  previewElementId: string
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

// Transform API data to form format (for editing)
export function transformFromApiFormat(
  apiData: InvoiceResponse
): CreateInvoiceDTO {
  console.log("apiData", apiData);
  return {
    businessId: apiData.businessId,
    invoiceNumber: apiData.invoiceNumber,
    issueDate: new Date(apiData.issueDate),
    dueDate: new Date(apiData.dueDate),
    purchaseOrder: apiData.purchaseOrder,
    customHeader: apiData.customHeader,
    clientId: apiData.clientId,
    discount: apiData.discount,
    discountType: apiData.discountType as "NONE" | "PERCENTAGE" | "FIXED",
    taxMode: apiData.taxMode,
    taxName: apiData.taxName,
    taxPercentage: apiData.taxPercentage,
    notes: apiData.notes,
    terms: apiData.terms,
    currency: apiData.currency,
  };
}
