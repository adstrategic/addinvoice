"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useEstimateForAccept,
  useEstimatePdfForAccept,
  useAcceptEstimateByToken,
  useRejectEstimateByToken,
  PublicEstimateError,
} from "@/features/estimates";
import { ApiError } from "@/lib/errors/handler";
import type {
  AcceptEstimateByTokenBody,
  RejectEstimateByTokenBody,
} from "@/features/estimates/service/public-estimates.service";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

const makeAcceptFormSchema = (requireSignature: boolean) =>
  z
    .object({
      fullName: z.string().trim().min(1, "Full name is required"),
      signatureImageDataUrl: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (requireSignature && !values.signatureImageDataUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["signatureImageDataUrl"],
          message: "Signature is required",
        });
      }
    });

type AcceptFormValues = z.infer<ReturnType<typeof makeAcceptFormSchema>>;

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

export default function EstimateAcceptPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [outcome, setOutcome] = useState<
    "accepted" | "rejected" | "already_accepted" | null
  >(null);
  const router = useRouter();

  const signatureRef = useRef<SignatureCanvas | null>(null);

  const { data: estimate, isLoading, error } = useEstimateForAccept(token);
  const {
    data: pdfBytes,
    isPending: isPdfPending,
    isError: isPdfError,
    error: pdfError,
    refetch: refetchPdf,
  } = useEstimatePdfForAccept(token);
  const acceptMutation = useAcceptEstimateByToken(token);
  const rejectMutation = useRejectEstimateByToken(token);
  const requireSignature = !!estimate?.requireSignature;
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(makeAcceptFormSchema(requireSignature)),
    defaultValues: {
      fullName: "",
      signatureImageDataUrl: undefined,
    },
    mode: "onChange",
  });

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

  const handleAcceptSubmit = useCallback(
    async (values: AcceptFormValues) => {
      if (!token || !estimate) return;

      const payload: AcceptEstimateByTokenBody = {
        fullName: values.fullName.trim(),
        ...(values.signatureImageDataUrl
          ? {
              signatureData: {
                fullName: values.fullName.trim(),
                signedAt: new Date().toISOString(),
                signatureImage: values.signatureImageDataUrl,
              },
            }
          : {}),
      };

      try {
        await acceptMutation.mutateAsync(payload);
        setOutcome("accepted");
      } catch (err) {
        if (err instanceof PublicEstimateError && err.code === "CONFLICT") {
          setOutcome("already_accepted");
        }
      }
    },
    [token, estimate, acceptMutation],
  );

  const handleRejectSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      const payload: RejectEstimateByTokenBody = {
        rejectionReason: rejectReason.trim() || undefined,
      };
      try {
        await rejectMutation.mutateAsync(payload);
        setShowRejectForm(false);
        setOutcome("rejected");
      } catch (err) {
        if (err instanceof PublicEstimateError && err.code === "CONFLICT") {
          setOutcome("already_accepted");
        }
      }
    },
    [token, rejectReason, rejectMutation],
  );

  const clearSignature = useCallback(() => {
    signatureRef.current?.clear();
    form.setValue("signatureImageDataUrl", undefined, { shouldValidate: true });
  }, [form]);

  const captureSignature = useCallback(() => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      form.setValue("signatureImageDataUrl", dataUrl, { shouldValidate: true });
    }
  }, [form]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Invalid link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Loading estimate…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const isApiError = error instanceof ApiError;
    const statusCode = isApiError ? error.statusCode : undefined;

    if (statusCode === 404) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Link invalid or expired</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This estimate link is invalid or has expired. Please contact the
                sender for a new link.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (statusCode === 410) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Already accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This estimate has already been accepted. You do not need to take
                any further action.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Failed to load estimate.</p>
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (outcome === "already_accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This estimate has already been accepted. You do not need to take
              any further action.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (estimate?.status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This estimate was previously rejected. Please contact the sender
              if you need a new version.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (outcome === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Estimate accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you. This estimate has been accepted successfully.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (outcome === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Estimate rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You have rejected this estimate. Thank you for your feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate || estimate.status !== "SENT") {
    return null;
  }

  const canAccept =
    !acceptMutation.isPending &&
    form.formState.isValid &&
    form.watch("fullName").trim().length > 0;
  const isSubmitting = acceptMutation.isPending;

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-4 bg-muted/30">
        <div className="w-full max-w-5xl space-y-6">
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Estimate #{estimate.estimateNumber}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview generated from the estimate PDF
                </p>
              </header>
            </CardHeader>

            <CardContent className="pt-4 sm:pt-6 space-y-6 p-4 sm:p-6">
              {isPdfPending || (pdfBytes && !pdfDoc) ? (
                <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading PDF preview...</span>
                  </div>
                </div>
              ) : null}

              {!isPdfPending && (isPdfError || !pdfBytes) ? (
                <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center px-4">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {pdfError instanceof Error
                        ? pdfError.message
                        : "Could not load PDF preview."}
                    </p>
                    <Button variant="outline" onClick={() => void refetchPdf()}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : null}

              {pdfDoc && !isPdfPending && !isPdfError ? (
                <div
                  ref={previewContainerRef}
                  className="h-[80vh] overflow-auto p-4 flex flex-col items-center gap-4 border border-border rounded-lg"
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
              ) : null}

              <Separator />

              <p className="text-sm text-muted-foreground">
                {estimate.requireSignature
                  ? "Confirm your acceptance by entering your full name and signing below."
                  : "Please confirm your acceptance by entering your full name below."}
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAcceptSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your full name"
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {estimate.requireSignature && (
                    <FormField
                      control={form.control}
                      name="signatureImageDataUrl"
                      render={() => (
                        <FormItem>
                          <FormLabel>Signature *</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="rounded-lg border border-border overflow-hidden bg-white">
                                <SignatureCanvas
                                  ref={signatureRef}
                                  canvasProps={{
                                    className: "w-full h-40 touch-none",
                                    style: { width: "100%", height: "160px" },
                                  }}
                                  onEnd={captureSignature}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearSignature}
                              >
                                Clear signature
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={!canAccept}>
                      {isSubmitting ? "Accepting…" : "Accept estimate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isSubmitting}
                    >
                      Reject estimate
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showRejectForm} onOpenChange={setShowRejectForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Optionally tell the sender why you are rejecting this estimate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            id="reject-estimate-form"
            onSubmit={handleRejectSubmit}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="rejectionReason">
                Reason for rejection (optional)
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Budget doesn't allow at this time..."
                rows={4}
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={rejectMutation.isPending}>
                Back
              </AlertDialogCancel>
              <Button
                type="submit"
                form="reject-estimate-form"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject estimate"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
