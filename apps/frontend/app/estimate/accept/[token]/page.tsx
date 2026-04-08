"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { format } from "date-fns";
// import { enUS } from "date-fns/locale";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import {
  useEstimateForAccept,
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

function getItemFixedDiscount(item: {
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType?: string | null;
}): number {
  if (!item.discount || item.discountType === "NONE" || !item.discountType)
    return 0;
  const base = item.quantity * item.unitPrice;
  if (item.discountType === "PERCENTAGE") return (base * item.discount) / 100;
  if (item.discountType === "FIXED") return item.discount;
  return 0;
}

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
  const acceptMutation = useAcceptEstimateByToken(token);
  const rejectMutation = useRejectEstimateByToken(token);
  const requireSignature = !!estimate?.requireSignature;

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

  const companyData = estimate.business;
  const client = estimate.client;
  const items = estimate.items ?? [];
  const canAccept =
    !acceptMutation.isPending &&
    form.formState.isValid &&
    form.watch("fullName").trim().length > 0;
  const isSubmitting = acceptMutation.isPending;

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-4 bg-muted/30">
        <div className="w-full max-w-2xl space-y-6">
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <header className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    ESTIMATE
                  </h1>

                  <p className="text-sm font-semibold text-gray-400 mt-1">
                    # {estimate.estimateNumber}
                  </p>
                </div>
                {/* 
              { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: left center; display: block; }
                */}
                <div className="flex flex-1 items-center gap-6 justify-end">
                  {companyData.logo && (
                    <div className="max-w-[320px] h-[120px] flex items-center shrink-0">
                      <img
                        src={companyData.logo}
                        alt="Company Logo"
                        className="object-contain max-w-full max-h-full block"
                      />
                    </div>
                  )}
                </div>
              </header>
            </CardHeader>

            <CardContent className="pt-4 sm:pt-6 space-y-6 p-4 sm:p-6">
              {/* Bill To */}
              {client && (
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      BILL TO:
                    </h4>
                    <p className="font-semibold text-foreground">
                      {client.name}
                    </p>
                    {client.businessName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {client.businessName}
                      </p>
                    )}
                    {estimate.clientAddress && (
                      <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                        {estimate.clientAddress}
                      </p>
                    )}
                    {estimate.clientPhone && (
                      <p className="text-sm text-muted-foreground">
                        {estimate.clientPhone}
                      </p>
                    )}
                    {estimate.clientEmail && (
                      <p className="text-sm text-muted-foreground break-all">
                        {estimate.clientEmail}
                      </p>
                    )}
                    {client.nit && (
                      <p className="text-sm text-muted-foreground">
                        NIT: {client.nit}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 md:text-right">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      FROM:
                    </h4>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      {companyData.name}
                    </h2>
                    {companyData.address && (
                      <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                        {companyData.address}
                      </p>
                    )}
                    {companyData.nit && (
                      <p className="text-sm text-muted-foreground">
                        NIT: {companyData.nit}
                      </p>
                    )}
                    {companyData.email && (
                      <p className="text-sm text-muted-foreground break-all">
                        {companyData.email}
                      </p>
                    )}
                    {companyData.phone && (
                      <p className="text-sm text-muted-foreground">
                        {companyData.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* summary */}
              {estimate.summary && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Project Summary:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {estimate.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* timeline */}
              {(estimate.timelineStartDate || estimate.timelineEndDate) && (
                <div className="overflow-hidden">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Timeline:
                    </h4>
                    <div className="flex flex-col items-center w-full">
                      <div className="w-full border-l border-t border-r border-border h-2" />
                      <div className="flex justify-between w-full mt-2 text-sm text-muted-foreground">
                        {estimate.timelineStartDate && (
                          <span>
                            {/* {format(estimate.timelineStartDate, "PPP", {
                            locale: enUS,
                          })} */}
                            {formatDateOnly(estimate.timelineStartDate)}
                          </span>
                        )}
                        {estimate.timelineEndDate && (
                          <span>
                            {/* {format(estimate.timelineEndDate, "PPP", {
                            locale: enUS,
                          })} */}
                            {formatDateOnly(estimate.timelineEndDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table: horizontal scroll on small screens */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground">
                          Description
                        </th>
                        <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                          Qty
                        </th>
                        <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                          Unit Price
                        </th>
                        <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                          Tax
                        </th>
                        <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                          Discount
                        </th>
                        <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const itemDiscount = getItemFixedDiscount(item);
                        return (
                          <tr key={item.id} className="border-t border-border">
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-foreground max-w-[180px] sm:max-w-none">
                              <div>
                                <div
                                  className="font-medium truncate"
                                  title={item.name}
                                >
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                              {item.quantity} {item.quantityUnit}
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                              {estimate.currency} {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                              {item.tax}%
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                              {formatCurrency(itemDiscount)}
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-semibold text-foreground whitespace-nowrap">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(estimate.subtotal)}
                    </span>
                  </div>
                  {estimate.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-semibold text-foreground">
                        -
                        {estimate.discountType === "PERCENTAGE"
                          ? formatCurrency(
                              (estimate.discount * estimate.subtotal) / 100,
                            )
                          : formatCurrency(estimate.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(estimate.totalTax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(estimate.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {estimate.notes && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Notes:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {estimate.notes}
                  </p>
                </div>
              )}

              {estimate.terms && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Terms & Conditions:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {estimate.terms}
                  </p>
                </div>
              )}
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
