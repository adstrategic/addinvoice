"use client";

import { PdfDocumentViewer } from "@/components/pdf/pdf-document-viewer";
import { useAdvancePdfBytes } from "../hooks/useAdvances";

interface AdvancePdfPreviewProps {
  sequence: number;
  title: string;
}

export function AdvancePdfPreview({ sequence, title }: AdvancePdfPreviewProps) {
  const {
    data: pdfBytes,
    isPending,
    isError,
    error,
    refetch,
  } = useAdvancePdfBytes(sequence, true);

  return (
    <PdfDocumentViewer
      pdfBytes={pdfBytes}
      isLoading={isPending}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => void refetch()}
      ariaLabel={`Advance ${title} PDF preview`}
      fileName={`${title}.pdf`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
