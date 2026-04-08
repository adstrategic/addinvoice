// hooks/use-download-invoice-pdf.ts
import { useAuth } from "@clerk/nextjs";
import type { InvoiceResponse } from "../schemas/invoice.schema";

export function useDownloadInvoicePdf() {
  const { getToken } = useAuth();

  const downloadPdf = async (invoice: InvoiceResponse) => {
    const token = await getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoice.sequence}/pdf`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to generate PDF");

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `invoice-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  };

  return downloadPdf;
}
