"use client";

import { PdfDocumentViewer } from "@/components/pdf/pdf-document-viewer";
import { useInvoicePdfBytes } from "@/features/invoices/hooks/useInvoices";

interface InvoicePdfPreviewProps {
  sequence: number;
  invoiceNumber: string;
}

export function InvoicePdfPreview({
  sequence,
  invoiceNumber,
}: InvoicePdfPreviewProps) {
  const {
    data: pdfBytes,
    isPending,
    isError,
    error,
    refetch,
  } = useInvoicePdfBytes(sequence, true);

  return (
    <PdfDocumentViewer
      pdfBytes={pdfBytes}
      isLoading={isPending}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => void refetch()}
      ariaLabel={`Invoice ${invoiceNumber} PDF preview`}
      fileName={`${invoiceNumber}.pdf`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
