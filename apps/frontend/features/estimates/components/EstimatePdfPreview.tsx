"use client";

import { DocumentImageViewer } from "@/components/pdf/document-image-viewer";
import { useAuthenticatedPreviewPageResolver } from "@/hooks/use-authenticated-preview-page-resolver";
import { useEstimatePreview } from "@/features/estimates";

interface EstimatePdfPreviewProps {
  sequence: number;
  estimateNumber: string;
}

export function EstimatePdfPreview({
  sequence,
  estimateNumber,
}: EstimatePdfPreviewProps) {
  const {
    data: preview,
    isPending,
    isError,
    error,
    refetch,
  } = useEstimatePreview(sequence, true);

  const previewBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/${sequence}/preview`;
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
      ariaLabel={`Estimate ${estimateNumber} preview`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
