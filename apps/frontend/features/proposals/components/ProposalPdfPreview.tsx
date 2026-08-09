"use client";

import { DocumentImageViewer } from "@/components/pdf/document-image-viewer";
import { useAuthenticatedPreviewPageResolver } from "@/hooks/use-authenticated-preview-page-resolver";
import { useProposalPreview } from "@/features/proposals";

interface ProposalPdfPreviewProps {
  sequence: number;
  proposalNumber: string;
}

export function ProposalPdfPreview({
  sequence,
  proposalNumber,
}: ProposalPdfPreviewProps) {
  const {
    data: preview,
    isPending,
    isError,
    error,
    refetch,
  } = useProposalPreview(sequence, true);

  const previewBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/proposals/${sequence}/preview`;
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
      ariaLabel={`Proposal ${proposalNumber} preview`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
