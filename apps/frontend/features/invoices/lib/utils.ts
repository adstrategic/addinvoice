import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type {
  InvoiceResponse,
  InvoiceItemResponse,
} from "../schemas/invoice.schema";

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
