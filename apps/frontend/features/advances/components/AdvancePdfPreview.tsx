"use client";

import { DocumentImageViewer } from "@/components/pdf/document-image-viewer";
import { useAuthenticatedPreviewPageResolver } from "@/hooks/use-authenticated-preview-page-resolver";
import { useAdvancePreview } from "../hooks/useAdvances";

interface AdvancePdfPreviewProps {
  sequence: number;
  title: string;
}

export function AdvancePdfPreview({ sequence, title }: AdvancePdfPreviewProps) {
  const {
    data: preview,
    isPending,
    isError,
    error,
    refetch,
  } = useAdvancePreview(sequence, true);

  const previewBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/advances/${sequence}/preview`;
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
      ariaLabel={`Advance ${title} preview`}
      containerClassName="h-[80vh] overflow-auto flex flex-col items-center gap-4"
    />
  );
}
