"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
}

function PdfPage({ pdf, pageNumber, containerWidth }: PdfPageProps) {
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

        const dpr = window.devicePixelRatio || 1;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;

        renderTask = page.render({ canvas, canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (err) {
        if ((err as { name?: string }).name !== "RenderingCancelledException") {
          console.error(`PDF page ${pageNumber} render error:`, err);
        }
      } finally {
        page?.cleanup();
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, containerWidth]);

  return <canvas ref={canvasRef} className="shrink-0 bg-white shadow-sm" />;
}

export interface PdfDocumentViewerProps {
  pdfBytes?: Uint8Array;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  containerClassName?: string;
  scrollClassName?: string;
}

export function PdfDocumentViewer({
  pdfBytes,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  containerClassName = "h-[80vh] overflow-auto p-4 flex flex-col items-center gap-4 border border-border rounded-lg",
  scrollClassName,
}: PdfDocumentViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!pdfBytes) {
      setPdfDoc(null);
      return;
    }

    let doc: PDFDocumentProxy | null = null;
    const task = pdfjsLib.getDocument({ data: pdfBytes });

    task.promise.then((loaded) => {
      doc = loaded;
      setPdfDoc(loaded);
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

  const showLoading = isLoading || (pdfBytes && !pdfDoc && !isError);

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
    >
      {containerWidth > 0 &&
        Array.from({ length: pdfDoc.numPages }, (_, i) => (
          <PdfPage
            key={i}
            pdf={pdfDoc}
            pageNumber={i + 1}
            containerWidth={containerWidth}
          />
        ))}
    </div>
  );
}
