"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import type { RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { useEstimatePdfBytes } from "@/features/estimates";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();
}

interface EstimatePdfPreviewProps {
  sequence: number;
  estimateNumber: string;
}

/** Preset zoom factors; re-renders pdf.js at higher resolution when > 1. */
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const;
const DEFAULT_ZOOM_INDEX = 1;

async function waitForCanvases(
  refs: Array<HTMLCanvasElement | null>,
  expected: number,
  maxFrames = 30,
) {
  for (let i = 0; i < maxFrames; i += 1) {
    const ready = refs.slice(0, expected).every(Boolean);
    if (ready) return;
    await new Promise<void>((r) => {
      requestAnimationFrame(() => r());
    });
  }
}

/**
 * Tracks the scroll container width for pdf.js viewport scaling.
 * `layoutKey` should bump when the container mounts (e.g. numPages) so we
 * attach after conditional render paths that omit the node.
 */
function useContainerWidth(
  containerRef: RefObject<HTMLDivElement | null>,
  layoutKey: number,
) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref object stable; layoutKey when container mounts
  }, [layoutKey]);

  return width;
}

export function EstimatePdfPreview({
  sequence,
  estimateNumber,
}: EstimatePdfPreviewProps) {
  const {
    data: pdfBytes,
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useEstimatePdfBytes(sequence, true);

  const [numPages, setNumPages] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderRetryKey, setRenderRetryKey] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  const containerWidth = useContainerWidth(containerRef, numPages);

  useEffect(() => {
    if (!pdfBytes) {
      setNumPages(0);
      const doc = pdfDocRef.current;
      pdfDocRef.current = null;
      if (doc) void doc.destroy();
      return;
    }

    let cancelled = false;

    void (async () => {
      const task = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await task.promise;
      if (cancelled) {
        await pdf.destroy();
        return;
      }
      const prev = pdfDocRef.current;
      pdfDocRef.current = pdf;
      if (prev) void prev.destroy();
      setNumPages(pdf.numPages);
    })();

    return () => {
      cancelled = true;
      const doc = pdfDocRef.current;
      pdfDocRef.current = null;
      if (doc) void doc.destroy();
      setNumPages(0);
    };
  }, [pdfBytes]);

  useEffect(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
  }, [pdfBytes]);

  const zoomFactor = ZOOM_LEVELS[zoomIndex] ?? 1;

  useLayoutEffect(() => {
    if (!pdfBytes || numPages < 1 || !pdfDocRef.current) return;

    const pdf = pdfDocRef.current;
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void }> = [];

    const run = async () => {
      try {
        setRenderError(null);
        setIsRendered(false);
        await waitForCanvases(canvasRefs.current, numPages);

        const el = containerRef.current;
        let width =
          el && el.clientWidth > 0
            ? el.clientWidth
            : typeof window !== "undefined"
              ? window.innerWidth - 48
              : 320;
        if (containerWidth > 0) {
          width = containerWidth;
        }

        const targetWidth =
          Math.max(width - 32, 280) * zoomFactor;

        for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
          if (cancelled) break;

          const canvas = canvasRefs.current[pageNumber - 1];
          if (!canvas) continue;

          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });
          const outputScale = window.devicePixelRatio || 1;
          const context = canvas.getContext("2d");

          if (!context) {
            page.cleanup();
            continue;
          }

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform =
            outputScale !== 1
              ? ([outputScale, 0, 0, outputScale, 0, 0] as [
                  number,
                  number,
                  number,
                  number,
                  number,
                  number,
                ])
              : undefined;

          const renderContext = {
            canvasContext: context,
            viewport,
            background: "white",
          } as Parameters<typeof page.render>[0];

          if (transform) {
            renderContext.transform = transform;
          }

          const renderTask = page.render(renderContext);
          renderTasks.push(renderTask);
          await renderTask.promise;
          page.cleanup();
        }

        if (!cancelled) {
          setIsRendered(true);
        }
      } catch (err) {
        if (!cancelled) {
          setIsRendered(false);
          setRenderError(
            err instanceof Error
              ? err.message
              : "Failed to render PDF preview",
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      renderTasks.forEach((task) => task.cancel());
    };
  }, [pdfBytes, numPages, containerWidth, renderRetryKey, zoomFactor]);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }, []);

  const handleRetryFetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleRetryRender = useCallback(() => {
    setRenderError(null);
    setRenderRetryKey((k) => k + 1);
  }, []);

  const isParsingDoc = Boolean(pdfBytes) && numPages < 1;
  if (isPending || isParsingDoc) {
    return (
      <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading PDF preview...</span>
        </div>
      </div>
    );
  }

  if (isError || !pdfBytes) {
    return (
      <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {queryError instanceof Error
              ? queryError.message
              : "Could not load PDF preview."}
          </p>
          <Button variant="outline" onClick={handleRetryFetch}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">{renderError}</p>
          <Button variant="outline" onClick={handleRetryRender}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[80vh] flex flex-col gap-2 min-h-0"
      aria-label={`Estimate ${estimateNumber} PDF sheet`}
    >
      <div
        className="flex shrink-0 items-center justify-center gap-2"
        role="toolbar"
        aria-label="PDF zoom"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleZoomOut}
          disabled={zoomIndex <= 0}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums min-w-13 text-center">
          {Math.round(zoomFactor * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleZoomIn}
          disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto p-4 bg-transparent flex flex-col items-center gap-4"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        {numPages > 0 &&
          Array.from({ length: numPages }, (_, index) => (
            <canvas
              key={index}
              ref={(node) => {
                canvasRefs.current[index] = node;
              }}
              className="bg-white shrink-0"
            />
          ))}

        {!isRendered ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Rendering PDF...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
