"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import {
  type PaymentMethodType,
  useWorkspacePaymentMethods,
} from "@/features/workspace";
import type { BusinessResponse } from "@addinvoice/schemas";
import { SendEstimateDialog } from "@/components/send-estimate-dialog";
import type {
  ClientResponse,
  CreateEstimateDTO,
  CreateEstimateItemDTO,
  EstimateResponse,
} from "@addinvoice/schemas";
import type { EstimateEditorItem } from "../types/editor";
import { HeaderSection } from "./form-fields/HeaderSection";
import { ClientSection } from "./form-fields/ClientSection";
import { DiscountsVATSection } from "./form-fields/DiscountsVATSection";
import { NotesSection } from "./form-fields/NotesSection";
import { TermsSection } from "./form-fields/TermsSection";
import { ProductsSection } from "./form-fields/ProductsSection";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingComponent from "@/components/loading-component";
import { toast } from "sonner";
import type { EstimateMutationCallbacks } from "../hooks/useEstimateActions";
import { useDownloadEstimatePdf } from "../hooks/useDownloadEstimatePDF";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

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
  /** When provided (edit mode), save is run before opening send dialog if form is dirty. */
  saveBeforeSend?: (callbacks?: EstimateMutationCallbacks) => Promise<void>;
  /** When provided (edit mode), save dirty header before opening item/catalog modals. Rejects on validation or mutation failure. */
  saveBeforeOpenSubform?: () => Promise<void>;
  /** When provided (edit mode), convert accepted estimate to invoice. */
  onConvertToInvoice?: (estimate: {
    sequence: number;
    selectedPaymentMethodId?: number | null;
  }) => void;
  isConvertingToInvoice?: boolean;
  draftItems?: EstimateEditorItem[];
  draftTotals?: {
    subtotal: number;
    totalTax: number;
    total: number;
  } | null;
  onDraftCreateItem?: (data: CreateEstimateItemDTO) => void;
  onDraftUpdateItem?: (uiKey: string, data: CreateEstimateItemDTO) => void;
  onDraftDeleteItem?: (uiKey: string) => void;
}

export function EstimateForm({
  selectedBusiness,
  onSubmit,
  onCancel,
  form,
  mode,
  existingEstimate,
  createdClient,
  isLoadingNumber,
  isLoadingEstimate,
  estimateError,
  isLoading,
  saveBeforeSend,
  saveBeforeOpenSubform,
  onConvertToInvoice,
  isConvertingToInvoice,
  draftItems = [],
  draftTotals = null,
  onDraftCreateItem,
  onDraftUpdateItem,
  onDraftDeleteItem,
}: EstimateFormProps) {
  const router = useRouter();
  const isDirty = form.formState.isDirty;
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingBeforeSend, setIsSavingBeforeSend] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    number | null
  >(null);
  const { confirmNavigation } = useUnsavedChangesWarning({
    enabled:
      isDirty &&
      !isLoading &&
      !form.formState.isSubmitting &&
      !isSavingBeforeSend,
  });

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
    paymentMethods?.filter((method) => method.isEnabled) ?? [];
  const paymentMethodLabels: Record<
    PaymentMethodType,
    { name: string; icon: "paypal" | "venmo" | "zelle" | "stripe" }
  > = {
    PAYPAL: { name: "PayPal", icon: "paypal" },
    VENMO: { name: "Venmo", icon: "venmo" },
    ZELLE: { name: "Zelle", icon: "zelle" },
    STRIPE: { name: "Stripe", icon: "stripe" },
  };

  const hasItems =
    mode === "create" ? draftItems.length > 0 : draftItems.length > 0;

  useEffect(() => {
    if (!existingEstimate) {
      setSelectedPaymentMethodId(null);
      return;
    }

    const estimateWithPayment = existingEstimate as EstimateResponse & {
      selectedPaymentMethodId?: number | null;
    };
    setSelectedPaymentMethodId(
      estimateWithPayment.selectedPaymentMethodId ?? null,
    );
  }, [existingEstimate]);

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirmNavigation()) {
                  onCancel();
                }
              }}
            >
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
            <Button
              onClick={() => {
                if (confirmNavigation()) {
                  onCancel();
                }
              }}
              variant="outline"
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-16 sm:mt-0 container mx-auto px-6 py-8 pb-28 max-w-7xl">
      {/* Header */}
      <div className="sm:flex items-center justify-between mb-8">
        <div className="flex mb-4 sm:mb-0 items-center gap-4">
          <Button
            className="hidden sm:block"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirmNavigation()) {
                onCancel();
              }
            }}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Information Sidebar */}
        <Card className="order-2 bg-card border-border lg:order-1 lg:col-span-1">
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
          className={`order-1 space-y-6 lg:order-2 lg:col-span-2 ${
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
                initialClient={
                  createdClient ?? existingEstimate?.client ?? null
                }
                mode={mode}
              />
            </form>
          </Form>

          <>
            {/* Products Section */}
            <ProductsSection
              estimateId={existingEstimate?.id || null}
              items={draftItems}
              taxData={taxData}
              mode={mode}
              form={form}
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
              draftTotals={draftTotals}
              onDraftCreateItem={onDraftCreateItem}
              onDraftUpdateItem={onDraftUpdateItem}
              onDraftDeleteItem={onDraftDeleteItem}
            />

            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div
                          className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${selectedPaymentMethodId == null ? "border-primary bg-secondary/50" : "border-border"}`}
                          onClick={() => setSelectedPaymentMethodId(null)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-foreground" />
                            </div>
                            <span className="font-medium text-foreground">
                              Manual
                            </span>
                          </div>
                        </div>
                        {enabledPaymentMethods.map((method) => {
                          const label = paymentMethodLabels[method.type];
                          const isSelected =
                            selectedPaymentMethodId === method.id;
                          return (
                            <div
                              key={method.id}
                              className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${isSelected ? "border-primary bg-secondary/50" : "border-border"}`}
                              onClick={() =>
                                setSelectedPaymentMethodId(method.id)
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
                                    alt="Venmo"
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
                                {label?.icon === "stripe" && (
                                  <Image
                                    src="/images/stripe-icon.webp"
                                    alt="Stripe"
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
                    </CardContent>
                </Card>

                {/* Notes Section */}
                <NotesSection form={form} />

                {/* Terms Section */}
                <TermsSection form={form} />
              </form>
            </Form>
          </>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:left-64">
        <div className="mx-auto flex max-w-7xl gap-2 pb-2 overflow-x-auto">
          {mode === "edit" && existingEstimate ? (
            <>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={form.formState.isSubmitting || isLoading || !isDirty}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="text-xs">Save</span>
              </Button>
              <Button
                type="button"
                onClick={handleSendClick}
                disabled={!hasItems || isSavingBeforeSend}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
                aria-label={
                  !hasItems ? "Add at least one item to send" : "Send Estimate"
                }
              >
                {isSavingBeforeSend ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="text-xs">Send</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (confirmNavigation()) {
                    router.push(`/estimates/${existingEstimate.sequence}`);
                  }
                }}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs">Preview</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-xs">Export</span>
              </Button>

              {existingEstimate.status === "ACCEPTED" && onConvertToInvoice && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    onConvertToInvoice({
                      sequence: existingEstimate.sequence,
                      selectedPaymentMethodId,
                    })
                  }
                  disabled={isConvertingToInvoice}
                  className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
                >
                  {isConvertingToInvoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  <span className="text-xs">Convert</span>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onSubmit}
                disabled={form.formState.isSubmitting || isLoading || !isDirty}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                <span className="text-xs">Back</span>
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={form.formState.isSubmitting || isLoading || !isDirty}
                className="h-auto min-w-20 flex-1 flex-col gap-1 py-2"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="text-xs">Create</span>
              </Button>
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
