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
import type {
  CreateEstimateDTO,
  CreateEstimateItemDTO,
} from "@addinvoice/schemas";
import type { EstimateEditorItem } from "../../types/editor";
import { ProductFormDialog } from "../../components/ProductFormDialog";
import { CatalogSelectionModal } from "../../components/CatalogSelectionModal";
import { useDeleteEstimateItem } from "../../hooks/useEstimateItems";
import { formatCurrency } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { estimateKeys } from "../../hooks/useEstimates";
import type { DiscountTypeEnum } from "@addinvoice/schemas";
import type z from "zod";

type DiscountType = z.infer<typeof DiscountTypeEnum>;

interface EstimateTotals {
  subtotal: number;
  totalTax: number;
  total: number;
  discount: number;
  discountType: DiscountType;
  taxName: string | null;
  taxPercentage: number | null;
}

interface ProductsSectionProps {
  estimateId: number | null;
  items: EstimateEditorItem[];
  taxData: {
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxName: string | null;
    taxPercentage: number | null;
  };
  mode: "create" | "edit";
  form: UseFormReturn<CreateEstimateDTO>;
  /** When provided (edit mode), save dirty header before opening product/catalog modal. Call before opening dialogs. */
  onBeforeOpenSubform?: () => Promise<void>;
  // Invoice-level totals from DB (when estimate exists)
  estimateTotals?: EstimateTotals | null;
  existingEstimate?: { id: number; business?: { id: number } } | null;
  existingInvoice?: { business: { id: number } } | null; // For getting businessId in edit mode (legacy)
  draftTotals?: {
    subtotal: number;
    totalTax: number;
    total: number;
  } | null;
  onDraftDeleteItem?: (uiKey: string) => void;
  onDraftCreateItem?: (data: CreateEstimateItemDTO) => void;
  onDraftUpdateItem?: (uiKey: string, data: CreateEstimateItemDTO) => void;
}

export function ProductsSection({
  estimateId,
  items,
  taxData,
  mode,
  form,
  onBeforeOpenSubform,
  estimateTotals,
  existingEstimate,
  existingInvoice,
  draftTotals,
  onDraftDeleteItem,
  onDraftCreateItem,
  onDraftUpdateItem,
}: ProductsSectionProps) {
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<EstimateEditorItem | null>(
    null,
  );

  const deleteItem = useDeleteEstimateItem();
  const queryClient = useQueryClient();

  const handleAddProduct = async () => {
    setEditingItem(null);

    // In edit mode, save dirty header before opening product dialog
    if (onBeforeOpenSubform) {
      try {
        await onBeforeOpenSubform();
      } catch {
        return;
      }
    }

    setShowProductDialog(true);
  };

  const handleEditProduct = async (item: EstimateEditorItem) => {
    if (mode === "edit" && (!estimateId || !item.persistedItemId)) {
      console.error("Cannot edit product: no estimate ID");
      return;
    }
    if (onBeforeOpenSubform) {
      try {
        await onBeforeOpenSubform();
      } catch {
        return;
      }
    }
    setEditingItem(item);
    setShowProductDialog(true);
  };

  const handleDeleteProduct = (item: EstimateEditorItem) => {
    if (mode === "create" && onDraftDeleteItem) {
      onDraftDeleteItem(item.uiKey);
      return;
    }
    if (!estimateId || !item.persistedItemId) return;
    setDeleteItemId(item.persistedItemId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !deleteItem.isPending) {
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!estimateId || deleteItemId === null) return;

    await deleteItem.mutateAsync({ estimateId, itemId: deleteItemId });
    setDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  const isDeleting = deleteItem.isPending;

  const handleAddFromCatalog = async () => {
    if (onBeforeOpenSubform) {
      try {
        await onBeforeOpenSubform();
      } catch {
        return;
      }
    }

    // Get businessId from existing estimate or form
    const businessId =
      existingEstimate?.business?.id ||
      existingInvoice?.business?.id ||
      form.getValues("businessId") ||
      null;

    if (!businessId) {
      form.setError("businessId", {
        type: "manual",
        message: "Please select a business first",
      });
      const businessField = document.querySelector('[name="businessId"]');
      if (businessField) {
        businessField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    form.clearErrors("businessId");
    setShowCatalogModal(true);
  };

  // Get businessId for catalog modal (from existing estimate or form)
  const getBusinessId = () => {
    return (
      existingInvoice?.business?.id || form.getValues("businessId") || null
    );
  };

  const handleCatalogSuccess = () => {
    if (mode === "create") return;
    // Invalidate estimate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
    queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
  };

  const getItemDisplayTotal = (item: EstimateEditorItem) => {
    const baseAmount = item.data.quantity * item.data.unitPrice;
    if (item.data.discountType === "PERCENTAGE") {
      return baseAmount - (baseAmount * item.data.discount) / 100;
    }
    if (item.data.discountType === "FIXED") {
      return baseAmount - item.data.discount;
    }
    return baseAmount;
  };

  // Calculate items subtotal (before estimate discount and before tax)
  // This is the sum of all items after item-level discounts, without tax
  const calculateItemsSubtotal = () => {
    return items.reduce((sum, item) => {
      let itemSubtotal = item.data.quantity * item.data.unitPrice;

      // Apply item-level discount
      if (item.data.discountType === "PERCENTAGE") {
        itemSubtotal = itemSubtotal * (1 - item.data.discount / 100);
      } else if (item.data.discountType === "FIXED") {
        itemSubtotal = itemSubtotal - item.data.discount;
      }

      return sum + itemSubtotal;
    }, 0);
  };

  // Get the displayed values - use DB values if available, otherwise calculate
  const getDisplayTotals = () => {
    if (mode === "create" && draftTotals) {
      return {
        itemsSubtotal: draftTotals.subtotal,
        discount: form.getValues("discount") || 0,
        discountType: form.getValues("discountType") || "NONE",
        totalTax: draftTotals.totalTax,
        total: draftTotals.total,
        taxName: form.getValues("taxName") || null,
        taxPercentage: form.getValues("taxPercentage") || null,
      };
    }

    if (estimateTotals) {
      // Use values from DB
      // Note: estimateTotals.subtotal is AFTER estimate discount (per backend logic)
      // const itemsSubtotal = calculateItemsSubtotal();
      return {
        itemsSubtotal: estimateTotals.subtotal, // Sum of items before estimate discount
        discount: estimateTotals.discount,
        discountType: estimateTotals.discountType,
        totalTax: estimateTotals.totalTax,
        total: estimateTotals.total,
        taxName: estimateTotals.taxName,
        taxPercentage: estimateTotals.taxPercentage,
      };
    }

    // Fallback: calculate locally (for create mode before estimate exists)
    const itemsSubtotal = calculateItemsSubtotal();
    const formDiscount = form.getValues("discount") || 0;
    const formDiscountType = form.getValues("discountType") || "NONE";
    const formTaxPercentage = form.getValues("taxPercentage") || null;
    const formTaxName = form.getValues("taxName") || null;

    // Apply estimate-level discount (tax must be calculated after all discounts)
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
        let itemSubtotal = item.data.quantity * item.data.unitPrice;
        if (item.data.discountType === "PERCENTAGE") {
          itemSubtotal = itemSubtotal * (1 - item.data.discount / 100);
        } else if (item.data.discountType === "FIXED") {
          itemSubtotal = itemSubtotal - item.data.discount;
        }
        return itemSubtotal;
      });
      if (taxData.taxMode === "BY_PRODUCT") {
        totalTax = items.reduce(
          (sum, item, index) =>
            sum + ((itemTotals[index] ?? 0) * ratio * (item.data.tax || 0)) / 100,
          0,
        );
      } else if (taxData.taxMode === "BY_TOTAL" && formTaxPercentage) {
        const taxableSubtotal = items.reduce(
          (sum, item, index) =>
            item.data.vatEnabled ? sum + (itemTotals[index] ?? 0) : sum,
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
              No products added yet. Click &quot;Add Product&quot; to get
              started.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.uiKey}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {item.data.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.data.description}
                          </p>
                        </div>
                        <div className="grid gap-2 md:grid-cols-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Quantity:
                            </span>{" "}
                            <span className="font-medium">
                              {item.data.quantity} {item.data.quantityUnit}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Unit Price:
                            </span>{" "}
                            <span className="font-medium">
                              {formatCurrency(item.data.unitPrice)}
                            </span>
                          </div>
                          {taxData.taxMode === "BY_PRODUCT" && item.data.tax && (
                            <div>
                              <span className="text-muted-foreground">
                                Tax:
                              </span>{" "}
                              <span className="font-medium">{item.data.tax}%</span>
                            </div>
                          )}
                          {item.data.discountType !== "NONE" &&
                            item.data.discount > 0 && (
                              <div>
                                <span className="text-muted-foreground">
                                  Discount:
                                </span>{" "}
                                <span className="font-medium">
                                  {item.data.discountType === "PERCENTAGE"
                                    ? `${item.data.discount}%`
                                    : formatCurrency(item.data.discount)}
                                </span>
                              </div>
                            )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(getItemDisplayTotal(item))}
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
                          onClick={() => handleDeleteProduct(item)}
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
                {/* Items Subtotal (before estimate discount) */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    {/* {formatCurrency(totals.itemsSubtotal)} */}
                    {formatCurrency(totals.itemsSubtotal || 0)}
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
                {totals.totalTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.totalTax)}
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
          estimateId={estimateId}
          taxData={taxData}
          item={editingItem}
          mode={mode}
          onDraftCreate={mode === "create" ? onDraftCreateItem : undefined}
          onDraftUpdate={mode === "create" ? onDraftUpdateItem : undefined}
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
          estimateId={estimateId}
          existingItems={items}
          taxData={taxData}
          mode={mode}
          onDraftCreateItem={mode === "create" ? onDraftCreateItem : undefined}
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
