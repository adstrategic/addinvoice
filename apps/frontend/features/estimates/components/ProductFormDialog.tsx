"use client";

import { useEffect } from "react";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createEstimateItemSchema,
  type CreateEstimateItemDTO,
} from "@addinvoice/schemas";
import type { EstimateEditorItem } from "../types/editor";
import {
  useCreateEstimateItem,
  useUpdateEstimateItem,
} from "../hooks/useEstimateItems";
import { NumericFormat } from "react-number-format";

function estimateItemDialogDefaults(
  editingItem: EstimateEditorItem | null | undefined,
): DefaultValues<CreateEstimateItemDTO> {
  return {
    name: editingItem?.data.name || "",
    description: editingItem?.data.description || "",
    quantity: editingItem?.data.quantity || 1,
    quantityUnit: editingItem?.data.quantityUnit || "UNITS",
    unitPrice: editingItem?.data.unitPrice || 0,
    discount: editingItem?.data.discount || 0,
    discountType: editingItem?.data.discountType || "NONE",
    tax: editingItem?.data.tax || 0,
    vatEnabled: editingItem?.data.vatEnabled || false,
    saveToCatalog:
      Boolean(editingItem?.data.saveToCatalog) ||
      editingItem?.data.catalogId != null,
  };
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: number | null;
  taxData: {
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxName: string | null;
    taxPercentage: number | null;
  };
  item?: EstimateEditorItem | null;
  mode?: "create" | "edit";
  onDraftCreate?: (data: CreateEstimateItemDTO) => void;
  onDraftUpdate?: (uiKey: string, data: CreateEstimateItemDTO) => void;
  onSuccess: (estimateId?: number) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  estimateId,
  taxData,
  item,
  mode = "edit",
  onDraftCreate,
  onDraftUpdate,
  onSuccess,
}: ProductFormDialogProps) {
  const createItem = useCreateEstimateItem();
  const updateItem = useUpdateEstimateItem();
  const isEditing = !!item;

  const form = useForm<CreateEstimateItemDTO>({
    resolver: zodResolver(createEstimateItemSchema),
    defaultValues: estimateItemDialogDefaults(item),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(estimateItemDialogDefaults(item));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when opening or switching row; avoid item identity churn
  }, [open, item?.uiKey, form]);

  // Handle discountType change - clear discount when switching to NONE
  const handleDiscountTypeChange = (newValue: string) => {
    if (!newValue) return;

    form.setValue("discountType", newValue as "NONE" | "PERCENTAGE" | "FIXED", {
      shouldDirty: true,
    });

    // Clear discount when switching to NONE
    if (newValue === "NONE") {
      form.setValue("discount", 0, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: CreateEstimateItemDTO) => {
    if (mode === "create") {
      if (isEditing && item && onDraftUpdate) {
        onDraftUpdate(item.uiKey, data);
      } else if (onDraftCreate) {
        onDraftCreate(data);
      }
      onSuccess(undefined);
      return;
    }

    let currentEstimateId = estimateId;
    const dataWithTaxMode = { ...data, ...taxData };

    // Validate that we have an estimate ID
    if (!currentEstimateId) {
      throw new Error("Estimate ID is required to add a product");
    }

    if (isEditing && item) {
      if (typeof item.persistedItemId !== "number") {
        throw new Error("Invalid item id for persisted estimate update");
      }
      await updateItem.mutateAsync({
        estimateId: currentEstimateId,
        itemId: item.persistedItemId,
        data: dataWithTaxMode,
      });
      onSuccess(currentEstimateId);
    } else {
      await createItem.mutateAsync({
        estimateId: currentEstimateId,
        data: dataWithTaxMode,
      });
      // Pass the estimateId back in case it was just created
      onSuccess(currentEstimateId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product information below."
              : "Enter the product details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g., Web Development Service"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description *</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                    placeholder="Detailed description of the product or service..."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="quantity">Quantity *</FieldLabel>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      customInput={Input}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="quantityUnit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="quantityUnit">
                      Quantity Unit *
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="quantityUnit"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNITS">Units</SelectItem>
                        <SelectItem value="HOURS">Hours</SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="unitPrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="unitPrice">Unit Price *</FieldLabel>
                  {/* <Input
                    {...field}
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                    placeholder="0.00"
                    onChange={field.onChange}
                    value={field.value ?? ""}
                  /> */}
                  <NumericFormat
                    id="unitPrice"
                    aria-invalid={fieldState.invalid}
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue);
                    }}
                    placeholder="0,00"
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    prefix="$"
                    customInput={Input}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="discountType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="discountType">
                      Discount Type
                    </FieldLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={handleDiscountTypeChange}
                    >
                      <SelectTrigger
                        id="discountType"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No Discount</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {form.watch("discountType") &&
                form.watch("discountType") !== "NONE" && (
                  <Controller
                    name="discount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="discount">
                          Discount{" "}
                          {form.watch("discountType") === "PERCENTAGE"
                            ? "(%)"
                            : "(Amount)"}{" "}
                          *
                        </FieldLabel>
                        <NumericFormat
                          id="discount"
                          aria-invalid={fieldState.invalid}
                          value={field.value}
                          onValueChange={(values) => {
                            field.onChange(values.floatValue);
                          }}
                          placeholder={
                            form.watch("discountType") === "PERCENTAGE"
                              ? "10"
                              : "50.00"
                          }
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          prefix={
                            form.watch("discountType") === "FIXED"
                              ? "$"
                              : undefined
                          }
                          customInput={Input}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}
            </div>

            {/* Tax field - conditional based on taxMode */}
            {taxData.taxMode === "BY_PRODUCT" && (
              <Controller
                name="tax"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="tax">Tax Percentage (%)</FieldLabel>
                    <NumericFormat
                      id="tax"
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      customInput={Input}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            {taxData.taxMode === "BY_TOTAL" && (
              <Controller
                name="vatEnabled"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id="vatEnabled"
                      checked={field.value || false}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldLabel htmlFor="vatEnabled" className="font-normal">
                      Enable VAT for this product
                    </FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="saveToCatalog"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className="mb-4 sm:mb-0"
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <Checkbox
                    id="saveToCatalog"
                    checked={field.value || false}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel htmlFor="saveToCatalog" className="font-normal">
                    Save to catalog (optional)
                  </FieldLabel>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                "Saving..."
              ) : isEditing ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
