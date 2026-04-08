"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Download,
  Send,
  CreditCard,
  Receipt,
} from "lucide-react";
import { useWorkspacePaymentMethods } from "@/features/workspace";
import type { BusinessResponse } from "@addinvoice/schemas";
import { SendEstimateDialog } from "@/components/send-estimate-dialog";
import type {
  ClientResponse,
  CreateEstimateDTO,
  CreateEstimateItemDTO,
  EstimateResponse,
} from "@addinvoice/schemas";
import { HeaderSection } from "./form-fields/HeaderSection";
import { ClientSection } from "./form-fields/ClientSection";
import { DiscountsVATSection } from "./form-fields/DiscountsVATSection";
import { NotesSection } from "./form-fields/NotesSection";
import { TermsSection } from "./form-fields/TermsSection";
import { ProductsSection } from "./form-fields/ProductsSection";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingComponent from "@/components/loading-component";
import { toast } from "sonner";
import type { EstimateMutationCallbacks } from "../hooks/useEstimateActions";
import { useDownloadEstimatePdf } from "../hooks/useDownloadEstimatePDF";

interface EstimateFormProps {
  selectedBusiness: BusinessResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  form: UseFormReturn<CreateEstimateDTO>;
  mode: "create" | "edit";
  isLoading: boolean;
  isLoadingNumber: boolean;
  isLoadingEstimate: boolean;
  estimateError: Error | null;
  existingEstimate?: EstimateResponse | null;
  /** Newly created client (e.g. from in-form create client flow). */
  createdClient?: ClientResponse | null;
  ensureEstimateExists?: (data: CreateEstimateItemDTO) => Promise<number>;
  /** When provided (edit mode), save is run before opening send dialog if form is dirty. */
  saveBeforeSend?: (callbacks?: EstimateMutationCallbacks) => Promise<void>;
  /** When provided (edit mode), save dirty header before opening item/catalog modals. Rejects on validation or mutation failure. */
  saveBeforeOpenSubform?: () => Promise<void>;
  /** When provided (edit mode), convert accepted estimate to invoice. */
  onConvertToInvoice?: (estimate: EstimateResponse) => void;
  isConvertingToInvoice?: boolean;
}

export function EstimateForm({
  selectedBusiness,
  onSubmit,
  onCancel,
  form,
  mode,
  existingEstimate,
  createdClient,
  ensureEstimateExists,
  isLoadingNumber,
  isLoadingEstimate,
  estimateError,
  isLoading,
  saveBeforeSend,
  saveBeforeOpenSubform,
  onConvertToInvoice,
  isConvertingToInvoice,
}: EstimateFormProps) {
  const router = useRouter();
  const isDirty = form.formState.isDirty;
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingBeforeSend, setIsSavingBeforeSend] = useState(false);

  const handleSendClick = async () => {
    if (saveBeforeSend && isDirty) {
      setIsSavingBeforeSend(true);
      await saveBeforeSend({
        onSuccess: () => {
          setSendDialogOpen(true);
          setIsSavingBeforeSend(false);
        },
      });
    } else {
      setSendDialogOpen(true);
    }
  };

  const downloadPdf = useDownloadEstimatePdf();

  const handleDownloadPDF = async () => {
    if (!existingEstimate) return;

    setIsExporting(true);

    try {
      await downloadPdf(existingEstimate);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const taxData = {
    taxMode: form.watch("taxMode") || "NONE",
    taxName: form.watch("taxName") || null,
    taxPercentage: form.watch("taxPercentage") || null,
  };

  const { data: paymentMethods } = useWorkspacePaymentMethods();
  const enabledPaymentMethods =
    paymentMethods?.filter((m) => m.isEnabled) ?? [];
  const hasItems = (existingEstimate?.items?.length ?? 0) > 0;

  // Show loading state in edit mode while estimate is loading
  if (mode === "edit" && isLoadingEstimate) {
    return <LoadingComponent variant="form" rows={8} />;
  }

  // Show error state if estimate failed to load
  if (mode === "edit" && estimateError && !existingEstimate) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Estimate
              </h1>
              <p className="text-muted-foreground mt-1">
                Error loading estimate
              </p>
            </div>
          </div>
        </div>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {estimateError?.message ||
                "Failed to load estimate. Please try again."}
            </p>
            <Button onClick={onCancel} variant="outline" className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-16 sm:mt-0 container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="sm:flex items-center justify-between mb-8">
        <div className="flex mb-4 sm:mb-0 items-center gap-4">
          <Button
            className="hidden sm:block"
            variant="ghost"
            size="icon"
            onClick={onCancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === "create" ? "Create Estimate" : "Edit Estimate"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "create"
                ? "Fill in the details to create a new estimate"
                : "Update estimate details and manage products"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "edit" && existingEstimate ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/estimates/${existingEstimate.sequence}`)
                }
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={form.formState.isSubmitting || isLoading || !isDirty}
                className="gap-2"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSendClick}
                disabled={!hasItems || isSavingBeforeSend}
                className="gap-2"
                aria-label={
                  !hasItems ? "Add at least one item to send" : "Send Estimate"
                }
              >
                {isSavingBeforeSend ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {!hasItems
                      ? "Add one item"
                      : isDirty && saveBeforeSend
                        ? "Save and send estimate"
                        : "Send Estimate"}
                  </>
                )}
              </Button>
              {existingEstimate.status === "ACCEPTED" && onConvertToInvoice && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onConvertToInvoice(existingEstimate)}
                    disabled={isConvertingToInvoice}
                    className="gap-2"
                  >
                    {isConvertingToInvoice ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Converting…
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4" />
                        Convert to Invoice
                      </>
                    )}
                  </Button>
                )}
            </>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={form.formState.isSubmitting || isLoading || !isDirty}
              className="gap-2"
            >
              {isLoading || form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Estimate…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Estimate
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Information Sidebar */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Logo</Label>

              <div className="mt-2 flex items-center justify-start w-full h-32 rounded-lg overflow-hidden ">
                {selectedBusiness.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedBusiness.logo}
                    alt={`${selectedBusiness.name} Logo`}
                    className="max-h-28 max-w-full object-contain mr-auto"
                  />
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    No logo available
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <div>
                <Label>Company Name</Label>
                <Input
                  placeholder="ADSTRATEGIC"
                  className="mt-1"
                  value={selectedBusiness.name}
                  disabled
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  placeholder="123 Business St, City, Country"
                  className="mt-1"
                  rows={2}
                  value={selectedBusiness.address}
                  disabled
                />
              </div>
              <div>
                <Label>NIT / Tax ID</Label>
                <Input
                  placeholder="123456789-0"
                  className="mt-1"
                  value={selectedBusiness.nit ?? ""}
                  disabled
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@adstrategic.com"
                  className="mt-1"
                  value={selectedBusiness.email}
                  disabled
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                  value={selectedBusiness.phone}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div
          className={`space-y-6 lg:col-span-2 ${
            isLoading ? "pointer-events-none opacity-60" : ""
          }`}
          aria-disabled={isLoading}
        >
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Header Section */}
              <HeaderSection isLoadingNumber={isLoadingNumber} form={form} />

              {/* Client Section */}
              <ClientSection
                form={form}
                estimate={existingEstimate || null}
                initialClient={createdClient ?? existingEstimate?.client ?? null}
                mode={mode}
              />
            </form>
          </Form>

          {/* Create mode: blur overlay over items and other sections until estimate is created */}
          {mode === "create" ? (
            <div className="relative">
              <div
                className="pointer-events-none select-none space-y-6 opacity-60 blur-[2px]"
                aria-hidden
              >
                <ProductsSection
                  estimateId={null}
                  items={[]}
                  taxData={taxData}
                  mode={mode}
                  form={form}
                  existingEstimate={null}
                  estimateTotals={null}
                />
                <Form {...form}>
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    <DiscountsVATSection form={form} />
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payment Method
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Optional. Choose how the client can pay this estimate.
                        </p>
                      </CardHeader>
                    </Card>
                    <NotesSection form={form} />
                    <TermsSection form={form} />
                  </form>
                </Form>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-lg border border-border bg-background/80 backdrop-blur-sm"
                aria-live="polite"
              >
                <p className="text-center text-sm text-muted-foreground max-w-xs px-4">
                  Create the estimate first to add items and edit other details.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Products Section - Always visible in edit (outside form to avoid nested forms) */}
              <ProductsSection
                estimateId={existingEstimate?.id || null}
                items={existingEstimate?.items || []}
                taxData={taxData}
                mode={mode}
                form={form}
                onEnsureEstimateExists={ensureEstimateExists}
                onBeforeOpenSubform={saveBeforeOpenSubform}
                existingEstimate={existingEstimate || null}
                estimateTotals={
                  existingEstimate
                    ? {
                        subtotal: existingEstimate.subtotal,
                        totalTax: existingEstimate.totalTax,
                        total: existingEstimate.total,
                        discount: existingEstimate.discount,
                        discountType:
                          (existingEstimate.discountType as
                            | "NONE"
                            | "PERCENTAGE"
                            | "FIXED") || "NONE",
                        taxName: existingEstimate.taxName ?? null,
                        taxPercentage: existingEstimate.taxPercentage ?? null,
                      }
                    : null
                }
              />

              <Form {...form}>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-6"
                >
                  {/* Discounts & VAT Section */}
                  <DiscountsVATSection form={form} />

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Optional. Choose how the client can pay this estimate.
                      </p>
                    </CardHeader>
                    {/* <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div
                      className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${form.watch("selectedPaymentMethodId") == null ? "border-primary bg-secondary/50" : "border-border"}`}
                      onClick={() =>
                        form.setValue("selectedPaymentMethodId", null, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          None
                        </span>
                      </div>
                    </div>
                    {enabledPaymentMethods.map((method) => {
                      const labels: Record<
                        string,
                        { name: string; icon: "paypal" | "venmo" | "zelle" }
                      > = {
                        PAYPAL: { name: "PayPal", icon: "paypal" },
                        VENMO: { name: "Venmo", icon: "venmo" },
                        ZELLE: { name: "Zelle", icon: "zelle" },
                      };
                      const label = labels[method.type];
                      const isSelected =
                        form.watch("selectedPaymentMethodId") === method.id;
                      return (
                        <div
                          key={method.id}
                          className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${isSelected ? "border-primary bg-secondary/50" : "border-border"}`}
                          onClick={() =>
                            form.setValue(
                              "selectedPaymentMethodId",
                              method.id,
                              { shouldDirty: true },
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            {label?.icon === "paypal" && (
                              <Image
                                src="/images/PayPal-icon.png"
                                alt="PayPal"
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            {label?.icon === "venmo" && (
                              <Image
                                src="/images/venmo-icon.png"
                                alt="PayPal"
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            {label?.icon === "zelle" && (
                              <Image
                                src="/images/zelle-icon.png"
                                alt="Zelle"
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            <span className="font-medium text-foreground">
                              {label?.name ?? method.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent> */}
                  </Card>

                  {/* Notes Section */}
                  <NotesSection form={form} />

                  {/* Terms Section */}
                  <TermsSection form={form} />
                </form>
              </Form>
            </>
          )}
        </div>
      </div>

      {mode === "edit" && existingEstimate && (
        <SendEstimateDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          estimateSequence={existingEstimate.sequence}
          estimateNumber={existingEstimate.estimateNumber}
          clientName={existingEstimate.client?.name ?? "Client"}
          clientEmail={existingEstimate.clientEmail}
        />
      )}
    </div>
  );
}
