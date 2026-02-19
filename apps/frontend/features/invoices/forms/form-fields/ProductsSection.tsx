"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Package, Loader2 } from "lucide-react";
import type { InvoiceItemResponse } from "../../schemas/invoice.schema";
import type { DiscountType } from "../../types/api";
import { ProductFormDialog } from "../../components/ProductFormDialog";
import { CatalogSelectionModal } from "../../components/CatalogSelectionModal";
import { useDeleteInvoiceItem } from "../../hooks/useInvoiceItems";
import { formatCurrency } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type {
  CreateInvoiceDTO,
  InvoiceItemCreateInput,
} from "../../schemas/invoice.schema";
import { useQueryClient } from "@tanstack/react-query";
import { invoiceKeys } from "../../hooks/useInvoices";

interface InvoiceTotals {
  subtotal: number;
  totalTax: number;
  total: number;
  discount: number;
  discountType: DiscountType;
  taxName: string | null;
  taxPercentage: number | null;
}

interface ProductsSectionProps {
  invoiceId: number | null;
  items: InvoiceItemResponse[];
  taxData: {
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxName: string | null;
    taxPercentage: number | null;
  };
  mode: "create" | "edit";
  form: UseFormReturn<CreateInvoiceDTO>;
  onEnsureInvoiceExists?: (data: InvoiceItemCreateInput) => Promise<number>;
  // Invoice-level totals from DB (when invoice exists)
  invoiceTotals?: InvoiceTotals | null;
  existingInvoice?: { business: { id: number } } | null; // For getting businessId in edit mode
}

export function ProductsSection({
  invoiceId,
  items,
  taxData,
  mode,
  form,
  onEnsureInvoiceExists,
  invoiceTotals,
  existingInvoice,
}: ProductsSectionProps) {
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<InvoiceItemResponse | null>(
    null,
  );

  const deleteItem = useDeleteInvoiceItem();
  const queryClient = useQueryClient();

  const handleAddProduct = () => {
    setEditingItem(null);

    // If in create mode, validate that client is selected
    if (mode === "create" && !invoiceId) {
      const clientId = form.getValues().clientId;
      if (!clientId || clientId === 0) {
        // Set error on form
        form.setError("clientId", {
          type: "manual",
          message: "Please select a client first",
        });
        // Scroll to client section
        const clientField = document.querySelector('[name="clientId"]');
        if (clientField) {
          clientField.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Clear any previous errors
      form.clearErrors("clientId");
    }

    // Open dialog - invoice will be created when product is saved
    setShowProductDialog(true);
  };

  const handleEditProduct = (item: InvoiceItemResponse) => {
    if (!invoiceId) {
      console.error("Cannot edit product: no invoice ID");
      return;
    }
    setEditingItem(item);
    setShowProductDialog(true);
  };

  const handleDeleteProduct = (itemId: number) => {
    if (!invoiceId) return;
    setDeleteItemId(itemId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !deleteItem.isPending) {
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!invoiceId || deleteItemId === null) return;

    await deleteItem.mutateAsync({ invoiceId, itemId: deleteItemId });
    setDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  const isDeleting = deleteItem.isPending;

  const handleAddFromCatalog = () => {
    // Get businessId from existing invoice or form
    const businessId =
      existingInvoice?.business?.id || form.getValues("businessId") || null;

    if (!businessId) {
      // Set error on form
      form.setError("businessId", {
        type: "manual",
        message: "Please select a business first",
      });
      // Scroll to business section if it exists
      const businessField = document.querySelector('[name="businessId"]');
      if (businessField) {
        businessField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Clear any previous errors
    form.clearErrors("businessId");
    setShowCatalogModal(true);
  };

  // Get businessId for catalog modal (from existing invoice or form)
  const getBusinessId = () => {
    return (
      existingInvoice?.business?.id || form.getValues("businessId") || null
    );
  };

  const handleCatalogSuccess = () => {
    // Invalidate invoice queries to refresh the data
    queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
    queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
  };

  // Calculate items subtotal (before invoice discount and before tax)
  // This is the sum of all items after item-level discounts, without tax
  const calculateItemsSubtotal = () => {
    return items.reduce((sum, item) => {
      let itemSubtotal = item.quantity * item.unitPrice;

      // Apply item-level discount
      if (item.discountType === "PERCENTAGE") {
        itemSubtotal = itemSubtotal * (1 - item.discount / 100);
      } else if (item.discountType === "FIXED") {
        itemSubtotal = itemSubtotal - item.discount;
      }

      return sum + itemSubtotal;
    }, 0);
  };

  // Get the displayed values - use DB values if available, otherwise calculate
  const getDisplayTotals = () => {
    if (invoiceTotals) {
      // Use values from DB
      // Note: invoiceTotals.subtotal is AFTER invoice discount (per backend logic)
      // const itemsSubtotal = calculateItemsSubtotal();
      return {
        itemsSubtotal: invoiceTotals.subtotal, // Sum of items before invoice discount
        discount: invoiceTotals.discount,
        discountType: invoiceTotals.discountType,
        totalTax: invoiceTotals.totalTax,
        total: invoiceTotals.total,
        taxName: invoiceTotals.taxName,
        taxPercentage: invoiceTotals.taxPercentage,
      };
    }

    // Fallback: calculate locally (for create mode before invoice exists)
    const itemsSubtotal = calculateItemsSubtotal();
    const formDiscount = form.getValues("discount") || 0;
    const formDiscountType = form.getValues("discountType") || "NONE";
    const formTaxPercentage = form.getValues("taxPercentage") || null;
    const formTaxName = form.getValues("taxName") || null;

    // Apply invoice-level discount (tax must be calculated after all discounts)
    let subtotalAfterDiscount = itemsSubtotal;
    if (formDiscountType === "PERCENTAGE") {
      subtotalAfterDiscount =
        itemsSubtotal - (itemsSubtotal * formDiscount) / 100;
    } else if (formDiscountType === "FIXED") {
      subtotalAfterDiscount = itemsSubtotal - formDiscount;
    }

    // Tax base = amount after all discounts; apply proportional discount ratio
    let totalTax = 0;
    if (itemsSubtotal > 0) {
      const ratio = subtotalAfterDiscount / itemsSubtotal;
      const itemTotals = items.map((item) => {
        let itemSubtotal = item.quantity * item.unitPrice;
        if (item.discountType === "PERCENTAGE") {
          itemSubtotal = itemSubtotal * (1 - item.discount / 100);
        } else if (item.discountType === "FIXED") {
          itemSubtotal = itemSubtotal - item.discount;
        }
        return itemSubtotal;
      });
      if (taxData.taxMode === "BY_PRODUCT") {
        totalTax = items.reduce(
          (sum, item, index) =>
            sum + (itemTotals[index] * ratio * (item.tax || 0)) / 100,
          0,
        );
      } else if (taxData.taxMode === "BY_TOTAL" && formTaxPercentage) {
        const taxableSubtotal = items.reduce(
          (sum, item, index) =>
            item.vatEnabled ? sum + itemTotals[index] : sum,
          0,
        );
        const taxableAfterDiscount = taxableSubtotal * ratio;
        totalTax = (taxableAfterDiscount * formTaxPercentage) / 100;
      }
    }

    const total = subtotalAfterDiscount + totalTax;

    return {
      itemsSubtotal,
      discount: formDiscount,
      discountType: formDiscountType,
      subtotalAfterDiscount,
      totalTax,
      total,
      taxName: formTaxName,
      taxPercentage: formTaxPercentage,
    };
  };

  const totals = getDisplayTotals();
  const hasInvoiceDiscount =
    totals.discountType !== "NONE" && totals.discount > 0;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="sm:flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground  mb-4 sm:mb-0">
              Items / Services
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleAddFromCatalog}
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Package className="h-4 w-4" />
                Add from Catalog
              </Button>
              <Button
                type="button"
                onClick={handleAddProduct}
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products added yet. Click "Add Product" to get started.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {item.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <div className="grid gap-2 md:grid-cols-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Quantity:
                            </span>{" "}
                            <span className="font-medium">
                              {item.quantity} {item.quantityUnit}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Unit Price:
                            </span>{" "}
                            <span className="font-medium">
                              {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                          {taxData.taxMode === "BY_PRODUCT" && item.tax && (
                            <div>
                              <span className="text-muted-foreground">
                                Tax:
                              </span>{" "}
                              <span className="font-medium">{item.tax}%</span>
                            </div>
                          )}
                          {item.discountType !== "NONE" &&
                            item.discount > 0 && (
                              <div>
                                <span className="text-muted-foreground">
                                  Discount:
                                </span>{" "}
                                <span className="font-medium">
                                  {item.discountType === "PERCENTAGE"
                                    ? `${item.discount}%`
                                    : formatCurrency(item.discount)}
                                </span>
                              </div>
                            )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => handleEditProduct(item)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleDeleteProduct(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-border space-y-2">
                {/* Items Subtotal (before invoice discount) */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    {/* {formatCurrency(totals.itemsSubtotal)} */}
                    {formatCurrency(invoiceTotals?.subtotal || 0)}
                  </span>
                </div>

                {/* Invoice-level Discount */}
                {hasInvoiceDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {totals.discountType === "PERCENTAGE"
                        ? ` (${totals.discount}%)`
                        : ""}
                      :
                    </span>
                    <span className="font-semibold text-destructive">
                      -
                      {formatCurrency(
                        totals.discountType === "PERCENTAGE"
                          ? (totals.itemsSubtotal * totals.discount) / 100
                          : totals.discount,
                      )}
                    </span>
                  </div>
                )}

                {/* Tax - BY_PRODUCT mode */}
                {invoiceTotals && invoiceTotals.totalTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(invoiceTotals.totalTax)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showProductDialog && (
        <ProductFormDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
          invoiceId={invoiceId}
          taxData={taxData}
          item={editingItem}
          mode={mode}
          onEnsureInvoiceExists={onEnsureInvoiceExists}
          onSuccess={() => {
            setShowProductDialog(false);
            setEditingItem(null);
          }}
        />
      )}

      {showCatalogModal && (
        <CatalogSelectionModal
          open={showCatalogModal}
          onOpenChange={setShowCatalogModal}
          businessId={getBusinessId()}
          invoiceId={invoiceId}
          existingItems={items}
          taxData={taxData}
          mode={mode}
          onEnsureInvoiceExists={onEnsureInvoiceExists}
          onSuccess={handleCatalogSuccess}
        />
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
