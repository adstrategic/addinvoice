import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type {
  InvoiceResponse,
  InvoiceItemResponse,
} from "../schemas/invoice.schema";

type ToastFn = (params: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

/**
 * Download invoice PDF from API and trigger file save. Shows toast on success/error.
 */
export async function downloadInvoicePdf(
  sequence: number,
  invoiceNumber: string,
  toast: ToastFn,
): Promise<void> {
  const response = await fetch(`/api/invoices/${sequence}/pdf`);
  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  toast({
    title: "PDF downloaded",
    description: "The invoice PDF has been downloaded successfully.",
  });
}

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
