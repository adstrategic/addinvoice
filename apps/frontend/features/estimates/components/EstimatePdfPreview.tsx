"use client";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { useEstimatePdfBytes } from "@/features/estimates";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

// ─── PdfPage ──────────────────────────────────────────────────────────────────

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

        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
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

// ─── EstimatePdfPreview ───────────────────────────────────────────────────────

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
    error: queryError,
    refetch,
  } = useEstimatePdfBytes(sequence, true);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Load / destroy PDF document whenever bytes change.
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

  // Measure container width immediately on mount, then track resizes.
  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);

    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry?.contentRect.width ?? 0);
    });
    ro.observe(el);
  }, []);

  // ── Render states ──────────────────────────────────────────────────────────

  if (isPending || (pdfBytes && !pdfDoc)) {
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
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[80vh] flex flex-col gap-2 min-h-0"
      aria-label={`Estimate ${estimateNumber} PDF preview`}
    >
      {/* Page container */}
      <div
        ref={containerCallbackRef}
        className="min-h-0 flex-1 overflow-auto p-4 flex flex-col items-center gap-4"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        {pdfDoc &&
          containerWidth > 0 &&
          Array.from({ length: pdfDoc.numPages }, (_, i) => (
            <PdfPage
              key={i}
              pdf={pdfDoc}
              pageNumber={i + 1}
              containerWidth={containerWidth}
            />
          ))}
      </div>
    </div>
  );
}
