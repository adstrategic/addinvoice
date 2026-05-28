"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PdfDocumentViewer } from "@/components/pdf/pdf-document-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useProposalForAccept,
  useProposalPdfForAccept,
  useAcceptProposalByToken,
  useRejectProposalByToken,
} from "@/features/proposals";
import { ApiError } from "@/lib/errors/handler";
import type {
  AcceptProposalByTokenBody,
  RejectProposalByTokenBody,
} from "@/features/proposals/service/public-proposals.service";
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

export default function ProposalAcceptPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [outcome, setOutcome] = useState<
    "accepted" | "rejected" | "already_accepted" | null
  >(null);
  const router = useRouter();

  const signatureRef = useRef<SignatureCanvas | null>(null);

  const { data: proposal, isLoading, error } = useProposalForAccept(token);
  const {
    data: pdfBytes,
    isPending: isPdfPending,
    isError: isPdfError,
    error: pdfError,
    refetch: refetchPdf,
  } = useProposalPdfForAccept(token);
  const acceptMutation = useAcceptProposalByToken(token);
  const rejectMutation = useRejectProposalByToken(token);
  const requireSignature = !!proposal?.requireSignature;

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(makeAcceptFormSchema(requireSignature)),
    defaultValues: {
      fullName: "",
      signatureImageDataUrl: undefined,
    },
    mode: "onChange",
  });

  const handleAcceptSubmit = useCallback(
    async (values: AcceptFormValues) => {
      if (!token || !proposal) return;

      const payload: AcceptProposalByTokenBody = {
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
      } catch {
        // hook's onError already shows a toast
      }
    },
    [token, proposal, acceptMutation],
  );

  const handleRejectSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      const payload: RejectProposalByTokenBody = {
        rejectionReason: rejectReason.trim() || undefined,
      };
      try {
        await rejectMutation.mutateAsync(payload);
        setShowRejectForm(false);
        setOutcome("rejected");
      } catch {
        // hook's onError already shows a toast
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

  if (outcome === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Proposal accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you. This proposal has been accepted successfully.
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
            <CardTitle>Proposal rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You have rejected this proposal. Thank you for your feedback.
            </p>
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
              This proposal has already been accepted. You do not need to take
              any further action.
            </p>
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
              Loading proposal…
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
                This proposal link is invalid or has expired. Please contact the
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
                This proposal has already been accepted. You do not need to take
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
            <p className="text-muted-foreground">Failed to load proposal.</p>
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (proposal?.status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This proposal was previously rejected. Please contact the sender
              if you need a new version.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal || proposal.status !== "SENT") {
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
            <CardHeader className="">
              <header>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Proposal #{proposal.proposalNumber}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview generated from the proposal PDF
                </p>
              </header>
            </CardHeader>

            <CardContent className="space-y-4">
              <PdfDocumentViewer
                pdfBytes={pdfBytes}
                isLoading={isPdfPending}
                isError={isPdfError || !pdfBytes}
                error={pdfError}
                onRetry={() => void refetchPdf()}
              />

              <Separator />

              <p className="text-sm text-muted-foreground">
                {proposal.requireSignature
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

                  {proposal.requireSignature && (
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
                      {isSubmitting ? "Accepting…" : "Accept proposal"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isSubmitting}
                    >
                      Reject proposal
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
            <AlertDialogTitle>Reject proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Optionally tell the sender why you are rejecting this proposal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            id="reject-proposal-form"
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
                form="reject-proposal-form"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject proposal"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
