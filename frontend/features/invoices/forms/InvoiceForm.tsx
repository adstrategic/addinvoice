"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { BusinessResponse } from "@/features/businesses";
import {
  CreateInvoiceDTO,
  InvoiceItemCreateInput,
} from "../schemas/invoice.schema";
import { invoiceKeys } from "../hooks/useInvoices";
import { HeaderSection } from "./form-fields/HeaderSection";
import { ClientSection } from "./form-fields/ClientSection";
import { DiscountsVATSection } from "./form-fields/DiscountsVATSection";
import { NotesSection } from "./form-fields/NotesSection";
import { TermsSection } from "./form-fields/TermsSection";
import { ProductsSection } from "./form-fields/ProductsSection";
import { PaymentsSection } from "./form-fields/PaymentsSection";
import type { InvoiceResponse } from "../types/api";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceFormProps {
  selectedBusiness: BusinessResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  form: UseFormReturn<CreateInvoiceDTO>;
  mode: "create" | "edit";
  isLoading: boolean;
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
  isLoadingInvoice,
  invoiceError,
  isLoading,
}: InvoiceFormProps) {
  const queryClient = useQueryClient();

  const handlePaymentAdded = async () => {
    // Refetch invoice data to get updated payments
    if (existingInvoice?.id) {
      await queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(existingInvoice.id),
      });
      // The useInvoiceBySequence hook in the manager will automatically refetch
    }
  };

  // Show loading state in edit mode while invoice is loading
  if (mode === "edit" && isLoadingInvoice) {
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
                Edit Invoice
              </h1>
              <p className="text-muted-foreground mt-1">
                Loading invoice data...
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Information Sidebar Skeleton */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div>
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Skeleton */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if invoice failed to load
  if (mode === "edit" && invoiceError) {
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
              {invoiceError.message ||
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
          <Button
            type="button"
            onClick={onSubmit}
            disabled={form.formState.isSubmitting || isLoading}
            className="gap-2"
          >
            {isLoading || form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating Invoice..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === "create" ? "Save Invoice" : "Update Invoice"}
              </>
            )}
          </Button>
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

        <Form {...form}>
          <div
            className={`space-y-6 lg:col-span-2 ${
              isLoading ? "pointer-events-none opacity-60" : ""
            }`}
            aria-disabled={isLoading}
          >
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Header Section */}
              <HeaderSection form={form} />

              {/* Client Section */}
              <ClientSection
                form={form}
                initialClient={existingInvoice?.client || null}
              />

              {/* Products Section - Always visible */}
              <ProductsSection
                invoiceId={existingInvoice?.id || null}
                items={existingInvoice?.items || []}
                taxMode={form.watch("taxMode") || "NONE"}
                mode={mode}
                form={form}
                onEnsureInvoiceExists={ensureInvoiceExists}
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

              {/* Discounts & VAT Section */}
              <DiscountsVATSection form={form} />

              {/* Notes Section */}
              <NotesSection form={form} />

              {/* Terms Section */}
              <TermsSection form={form} />

              {/* Payments Section - Only visible in edit mode when invoice exists */}
              {mode === "edit" && existingInvoice && (
                <PaymentsSection
                  invoiceId={existingInvoice.id}
                  payments={existingInvoice.payments || []}
                  invoiceTotal={existingInvoice.total}
                  onPaymentAdded={handlePaymentAdded}
                />
              )}
            </form>
          </div>
        </Form>
      </div>
    </div>
  );
}
