"use client";

import { PdfDocumentViewer } from "@/components/pdf/pdf-document-viewer";
import { useProposalPdfBytes } from "@/features/proposals";

interface ProposalPdfPreviewProps {
  sequence: number;
  proposalNumber: string;
}

export function ProposalPdfPreview({
  sequence,
  proposalNumber,
}: ProposalPdfPreviewProps) {
  const {
    data: pdfBytes,
    isPending,
    isError,
    error,
    refetch,
  } = useProposalPdfBytes(sequence, true);

  return (
    <PdfDocumentViewer
      pdfBytes={pdfBytes}
      isLoading={isPending}
      isError={isError}
      error={error instanceof Error ? error : null}
      onRetry={() => void refetch()}
      ariaLabel={`Proposal ${proposalNumber} PDF preview`}
      fileName={`${proposalNumber}.pdf`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
