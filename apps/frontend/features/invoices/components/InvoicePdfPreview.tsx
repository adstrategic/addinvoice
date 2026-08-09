"use client";

import { DocumentImageViewer } from "@/components/pdf/document-image-viewer";
import { useAuthenticatedPreviewPageResolver } from "@/hooks/use-authenticated-preview-page-resolver";
import { useInvoicePreview } from "@/features/invoices/hooks/useInvoices";

interface InvoicePdfPreviewProps {
  sequence: number;
  invoiceNumber: string;
}

export function InvoicePdfPreview({
  sequence,
  invoiceNumber,
}: InvoicePdfPreviewProps) {
  const {
    data: preview,
    isPending,
    isError,
    error,
    refetch,
  } = useInvoicePreview(sequence, true);

  const previewBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${sequence}/preview`;
  const resolvePageSrc = useAuthenticatedPreviewPageResolver(
    previewBaseUrl,
    preview?.hash,
  );

  return (
    <DocumentImageViewer
      pages={preview?.pages}
      resolvePageSrc={resolvePageSrc}
      isLoading={isPending}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => void refetch()}
      ariaLabel={`Invoice ${invoiceNumber} preview`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
