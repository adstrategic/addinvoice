"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Download,
  Send,
} from "lucide-react";
import { BusinessResponse } from "@/features/businesses";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadInvoicePdf } from "../lib/utils";
import {
  CreateInvoiceDTO,
  InvoiceItemCreateInput,
} from "../schemas/invoice.schema";
import { HeaderSection } from "./form-fields/HeaderSection";
import { ClientSection } from "./form-fields/ClientSection";
import { DiscountsVATSection } from "./form-fields/DiscountsVATSection";
import { NotesSection } from "./form-fields/NotesSection";
import { TermsSection } from "./form-fields/TermsSection";
import { ProductsSection } from "./form-fields/ProductsSection";
import { PaymentsSection } from "./form-fields/PaymentsSection";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingComponent from "@/components/loading-component";

interface InvoiceFormProps {
  selectedBusiness: BusinessResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  form: UseFormReturn<CreateInvoiceDTO>;
  mode: "create" | "edit";
  isLoading: boolean;
  isLoadingNumber: boolean;
  isLoadingInvoice: boolean;
  invoiceError: Error | null;
  existingInvoice?: InvoiceResponse | null;
  ensureInvoiceExists?: (data: InvoiceItemCreateInput) => Promise<number>;
}

export function InvoiceForm({
  selectedBusiness,
  onSubmit,
  onCancel,
  form,
  mode,
  existingInvoice,
  ensureInvoiceExists,
  isLoadingNumber,
  isLoadingInvoice,
  invoiceError,
  isLoading,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isDirty = form.formState.isDirty;
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const taxData = {
    taxMode: form.watch("taxMode") || "NONE",
    taxName: form.watch("taxName") || null,
    taxPercentage: form.watch("taxPercentage") || null,
  };

  const hasItems = (existingInvoice?.items?.length ?? 0) > 0;

  // Show loading state in edit mode while invoice is loading
  if (mode === "edit" && isLoadingInvoice) {
    return <LoadingComponent variant="form" rows={8} />;
  }

  // Show error state if invoice failed to load
  if (mode === "edit" && invoiceError && !existingInvoice) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Invoice
              </h1>
              <p className="text-muted-foreground mt-1">
                Error loading invoice
              </p>
            </div>
          </div>
        </div>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {invoiceError?.message ||
                "Failed to load invoice. Please try again."}
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
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === "create" ? "Create Invoice" : "Edit Invoice"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "create"
                ? "Fill in the details to create a new invoice"
                : "Update invoice details and manage products"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {mode === "edit" && existingInvoice ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/invoices/${existingInvoice.sequence}`)
                }
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    await downloadInvoicePdf(
                      existingInvoice.sequence,
                      existingInvoice.invoiceNumber,
                      toast,
                    );
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to download PDF",
                      variant: "destructive",
                    });
                  } finally {
                    setIsExporting(false);
                  }
                }}
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
                onClick={() => setSendDialogOpen(true)}
                disabled={!hasItems}
                className="gap-2"
                title={!hasItems ? "Add at least one item to send" : undefined}
                aria-label={
                  !hasItems ? "Add at least one item to send" : "Send Invoice"
                }
              >
                <Send className="h-4 w-4" />
                Send Invoice
              </Button>
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
                  Creating Invoice…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Invoice
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
                  value={selectedBusiness.nit}
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
                invoice={existingInvoice || null}
                initialClient={existingInvoice?.client || null}
                mode={mode}
              />
            </form>
          </Form>

          {/* Products Section - Always visible (outside form to avoid nested forms) */}
          <ProductsSection
            invoiceId={existingInvoice?.id || null}
            items={existingInvoice?.items || []}
            taxData={taxData}
            mode={mode}
            form={form}
            onEnsureInvoiceExists={ensureInvoiceExists}
            existingInvoice={existingInvoice || null}
            invoiceTotals={
              existingInvoice
                ? {
                    subtotal: existingInvoice.subtotal,
                    totalTax: existingInvoice.totalTax,
                    total: existingInvoice.total,
                    discount: existingInvoice.discount,
                    discountType:
                      (existingInvoice.discountType as
                        | "NONE"
                        | "PERCENTAGE"
                        | "FIXED") || "NONE",
                    taxName: existingInvoice.taxName,
                    taxPercentage: existingInvoice.taxPercentage,
                  }
                : null
            }
          />

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Discounts & VAT Section */}
              <DiscountsVATSection form={form} />

              {/* Notes Section */}
              <NotesSection form={form} />

              {/* Terms Section */}
              <TermsSection form={form} />
            </form>
          </Form>

          {/* Payments Section - Only visible in edit mode when invoice has items */}
          {mode === "edit" && existingInvoice && hasItems && (
            <PaymentsSection
              invoiceId={existingInvoice.id}
              invoiceSequence={existingInvoice.sequence}
              payments={existingInvoice.payments || []}
              invoiceTotal={existingInvoice.total}
            />
          )}
        </div>
      </div>

      {mode === "edit" && existingInvoice && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceSequence={existingInvoice.sequence}
          invoiceNumber={existingInvoice.invoiceNumber}
          clientName={existingInvoice.client?.name ?? "Client"}
          clientEmail={existingInvoice.client?.email}
        />
      )}
    </div>
  );
}
