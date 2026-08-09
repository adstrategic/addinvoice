"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface DocumentPreviewPage {
  page: number;
  width: number;
  height: number;
}

export interface DocumentImageViewerProps {
  pages?: DocumentPreviewPage[];
  /** Resolves a displayable image URL for a page (blob URL or public URL). */
  resolvePageSrc: (page: number) => Promise<string>;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  containerClassName?: string;
  scrollClassName?: string;
  ariaLabel?: string;
}

function PreviewPageImage({
  page,
  width,
  height,
  resolvePageSrc,
  isFirst,
}: {
  page: number;
  width: number;
  height: number;
  resolvePageSrc: (page: number) => Promise<string>;
  isFirst: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const resolved = await resolvePageSrc(page);
        if (cancelled) {
          if (resolved.startsWith("blob:")) URL.revokeObjectURL(resolved);
          return;
        }
        if (resolved.startsWith("blob:")) objectUrl = resolved;
        setSrc(resolved);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [page, resolvePageSrc]);

  return (
    <div
      data-page={page}
      className="w-full shrink-0 bg-white shadow-sm"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {failed ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Failed to load page {page}
        </div>
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Page ${page}`}
          className="block h-auto w-full bg-white"
          loading={isFirst ? "eager" : "lazy"}
          fetchPriority={isFirst ? "high" : "auto"}
          decoding="async"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}

export function DocumentImageViewer({
  pages,
  resolvePageSrc,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  containerClassName = "h-[80vh] overflow-auto p-4 flex flex-col items-center gap-4 border border-border rounded-lg",
  scrollClassName,
  ariaLabel,
}: DocumentImageViewerProps) {
  const stableResolve = useCallback(
    (page: number) => resolvePageSrc(page),
    [resolvePageSrc],
  );

  if (isLoading || (!pages && !isError)) {
    return (
      <div
        className={
          scrollClassName ??
          "h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center"
        }
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  if (isError || !pages || pages.length === 0) {
    return (
      <div
        className={
          scrollClassName ??
          "h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center px-4"
        }
      >
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Could not load document preview."}
          </p>
          {onRetry ? (
            <Button variant="outline" onClick={() => void onRetry()}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={containerClassName}
      style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      aria-label={ariaLabel}
    >
      {pages.map((page, index) => (
        <PreviewPageImage
          key={page.page}
          page={page.page}
          width={page.width}
          height={page.height}
          resolvePageSrc={stableResolve}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}
