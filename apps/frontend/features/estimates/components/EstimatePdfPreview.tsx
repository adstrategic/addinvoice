"use client";

import { PdfDocumentViewer } from "@/components/pdf/pdf-document-viewer";
import { useEstimatePdfBytes } from "@/features/estimates";

interface EstimatePdfPreviewProps {
  sequence: number;
  estimateNumber: string;
}

export function EstimatePdfPreview({
  sequence,
  estimateNumber,
}: EstimatePdfPreviewProps) {
  const {
    data: pdfBytes,
    isPending,
    isError,
    error,
    refetch,
  } = useEstimatePdfBytes(sequence, true);

  return (
    <PdfDocumentViewer
      pdfBytes={pdfBytes}
      isLoading={isPending}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => void refetch()}
      ariaLabel={`Estimate ${estimateNumber} PDF preview`}
      fileName={`${estimateNumber}.pdf`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
