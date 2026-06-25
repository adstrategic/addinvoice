"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

// WebKit / iOS Safari silently fails to paint a <canvas> whose backing store is
// too large (per-canvas area and total per-tab memory are both capped, and the
// caps are lower on low-RAM devices like the iPhone SE). We therefore (A) cap
// the device-pixel-ratio multiplier and clamp the rendered canvas area, and (B)
// only mount/paint pages near the viewport so we never hold every page's pixel
// buffer in memory at once. If rasterization still fails we (C) fall back to the
// browser's native PDF viewer via a blob URL.
const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_CANVAS_AREA = 4_194_304; // ~4M px — safe under iOS WebKit limits
const DEFAULT_PAGE_ASPECT = 1.414; // A4 height/width, used before a page measures

// ─── PdfPage ──────────────────────────────────────────────────────────────────

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  onRenderError: () => void;
}

function PdfPage({ pdf, pageNumber, containerWidth, onRenderError }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth <= 0) return;

    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy["render"]> | null = null;
    let page: PDFPageProxy | null = null;

    (async () => {
      try {
        page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        // CSS layout size always fills the container width…
        const cssScale = containerWidth / page.getViewport({ scale: 1 }).width;
        const cssViewport = page.getViewport({ scale: cssScale });

        // …while the backing store is the layout size times a capped DPR,
        // then clamped by total area so WebKit never rejects the canvas.
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
        let renderScale = cssScale * dpr;
        const probe = page.getViewport({ scale: renderScale });
        const area = probe.width * probe.height;
        if (area > MAX_CANVAS_AREA) {
          renderScale *= Math.sqrt(MAX_CANVAS_AREA / area);
        }
        const viewport = page.getViewport({ scale: renderScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // WebKit returns null here when it can't allocate the backing store.
          if (!cancelled) onRenderError();
          return;
        }
        if (cancelled) return;

        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
      } catch (err) {
        const name = (err as { name?: string }).name;
        if (name === "RenderingCancelledException") return;
        console.error(`PDF page ${pageNumber} render error:`, err);
        if (!cancelled) onRenderError();
      } finally {
        page?.cleanup();
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, containerWidth, onRenderError]);

  return <canvas ref={canvasRef} className="block bg-white" />;
}

// ─── PdfPageSlot (virtualization) ───────────────────────────────────────────────

interface PdfPageSlotProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  onRenderError: () => void;
}

function PdfPageSlot({
  pdf,
  pageNumber,
  containerWidth,
  onRenderError,
}: PdfPageSlotProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [aspect, setAspect] = useState<number>(DEFAULT_PAGE_ASPECT);

  // Measure the page's aspect ratio once so the placeholder reserves the right
  // height (keeps scroll position stable when canvases mount/unmount).
  useEffect(() => {
    let cancelled = false;
    pdf
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        const vp = page.getViewport({ scale: 1 });
        setAspect(vp.height / vp.width);
        page.cleanup();
      })
      .catch(() => {
        /* keep default aspect */
      });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  // Only paint pages near the viewport; unmount the canvas when far away.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const height =
    containerWidth > 0 ? Math.floor(containerWidth * aspect) : undefined;

  return (
    <div
      ref={wrapperRef}
      className="shrink-0 bg-white shadow-sm"
      style={{ width: containerWidth || undefined, height }}
    >
      {isVisible && containerWidth > 0 ? (
        <PdfPage
          pdf={pdf}
          pageNumber={pageNumber}
          containerWidth={containerWidth}
          onRenderError={onRenderError}
        />
      ) : null}
    </div>
  );
}

// ─── Fallback (native viewer) ───────────────────────────────────────────────────

function PdfNativeFallback({
  objectUrl,
  fileName,
  scrollClassName,
}: {
  objectUrl: string | null;
  fileName: string;
  scrollClassName?: string;
}) {
  return (
    <div
      className={
        scrollClassName ??
        "h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center px-4"
      }
    >
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-sm text-muted-foreground">
          This PDF couldn&apos;t be displayed inline on your device. Open or
          download it to view the full document.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {objectUrl ? (
            <>
              <a href={objectUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="default" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open PDF
                </Button>
              </a>
              <a href={objectUrl} download={fileName}>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── PdfDocumentViewer ──────────────────────────────────────────────────────────

export interface PdfDocumentViewerProps {
  pdfBytes?: Uint8Array;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  containerClassName?: string;
  scrollClassName?: string;
  ariaLabel?: string;
  /** Filename used by the native-viewer download fallback. */
  fileName?: string;
}

export function PdfDocumentViewer({
  pdfBytes,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  containerClassName = "h-[80vh] overflow-auto p-4 flex flex-col items-center gap-4 border border-border rounded-lg",
  scrollClassName,
  ariaLabel,
  fileName = "document.pdf",
}: PdfDocumentViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);

  // Stable blob URL for the native-viewer fallback. Built from the prop bytes,
  // which stay intact because getDocument below receives its own copy.
  const objectUrl = useMemo(() => {
    if (!pdfBytes || pdfBytes.byteLength === 0) return null;
    return URL.createObjectURL(
      new Blob([pdfBytes.slice().buffer], { type: "application/pdf" }),
    );
  }, [pdfBytes]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    setLoadFailed(false);
    setRenderFailed(false);

    if (!pdfBytes) {
      setPdfDoc(null);
      return;
    }

    let doc: PDFDocumentProxy | null = null;
    // Pass a copy so pdf.js can transfer/detach it to the worker without
    // detaching the buffer backing our fallback blob URL.
    const task = pdfjsLib.getDocument({ data: pdfBytes.slice() });

    task.promise
      .then((loaded) => {
        doc = loaded;
        setPdfDoc(loaded);
      })
      .catch((err) => {
        console.error("PDF document load error:", err);
        setLoadFailed(true);
      });

    return () => {
      task.destroy();
      doc?.destroy();
      setPdfDoc(null);
    };
  }, [pdfBytes]);

  const previewContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);

    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry?.contentRect.width ?? 0);
    });
    ro.observe(el);
  }, []);

  const handleRenderError = useCallback(() => setRenderFailed(true), []);

  const showLoading =
    !loadFailed && !renderFailed && (isLoading || (pdfBytes && !pdfDoc && !isError));

  if (showLoading) {
    return (
      <div
        className={
          scrollClassName ??
          "h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center"
        }
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading PDF preview...</span>
        </div>
      </div>
    );
  }

  // Inline canvas rendering failed but we have the bytes — offer the native viewer.
  if ((loadFailed || renderFailed) && pdfBytes) {
    return (
      <PdfNativeFallback
        objectUrl={objectUrl}
        fileName={fileName}
        scrollClassName={scrollClassName}
      />
    );
  }

  if (isError || !pdfBytes) {
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
              : "Could not load PDF preview."}
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

  if (!pdfDoc) return null;

  return (
    <div
      ref={previewContainerRef}
      className={containerClassName}
      style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      aria-label={ariaLabel}
    >
      {containerWidth > 0 &&
        Array.from({ length: pdfDoc.numPages }, (_, i) => (
          <PdfPageSlot
            key={i}
            pdf={pdfDoc}
            pageNumber={i + 1}
            containerWidth={containerWidth}
            onRenderError={handleRenderError}
          />
        ))}
    </div>
  );
}
