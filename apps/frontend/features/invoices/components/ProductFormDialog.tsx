"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  FieldContent,
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
  invoiceItemCreateSchema,
  invoiceItemUpdateSchema,
  type InvoiceItemCreateInput,
  type InvoiceItemUpdateInput,
} from "../schemas/invoice.schema";
import {
  useCreateInvoiceItem,
  useUpdateInvoiceItem,
} from "../hooks/useInvoiceItems";
import type { InvoiceItemResponse } from "../schemas/invoice.schema";
import { NumericFormat } from "react-number-format";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number | null;
  taxData: {
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxName: string | null;
    taxPercentage: number | null;
  };
  item?: InvoiceItemResponse | null;
  mode?: "create" | "edit";
  onEnsureInvoiceExists?: (data: InvoiceItemCreateInput) => Promise<number>;
  onSuccess: (invoiceId?: number) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  invoiceId,
  taxData,
  item,
  mode = "edit",
  onEnsureInvoiceExists,
  onSuccess,
}: ProductFormDialogProps) {
  const createItem = useCreateInvoiceItem();
  const updateItem = useUpdateInvoiceItem();
  const isEditing = !!item;
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const form = useForm<InvoiceItemCreateInput>({
    resolver: zodResolver(invoiceItemCreateSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      quantity: item?.quantity || 1,
      quantityUnit: item?.quantityUnit || "UNITS",
      unitPrice: item?.unitPrice || 0,
      discount: item?.discount || 0,
      discountType: item?.discountType || "NONE",
      tax: item?.tax || 0,
      vatEnabled: item?.vatEnabled || false,
      saveToCatalog: item?.catalogId !== null && item?.catalogId !== undefined,
    },
  });

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

  const onSubmit = async (data: InvoiceItemCreateInput) => {
    let currentInvoiceId = invoiceId;

    // Include taxMode, taxName, and taxPercentage in the data to sync with backend
    const dataWithTaxMode = { ...data, ...taxData };

    // If no invoice exists and we're in create mode, create invoice first
    if (!currentInvoiceId && mode === "create" && onEnsureInvoiceExists) {
      setIsCreatingInvoice(true);
      try {
        currentInvoiceId = await onEnsureInvoiceExists(dataWithTaxMode);
        // Navigation will happen in ensureInvoiceExists, so we don't need to do anything else
        return;
      } catch (error) {
        setIsCreatingInvoice(false);

        // If validation failed, close the modal so user can see invoice form errors
        if (error instanceof Error && error.message === "VALIDATION_FAILED") {
          onOpenChange(false);
          return;
        }

        // For other errors, re-throw
        throw error;
      }
    }

    // Validate that we have an invoice ID
    if (!currentInvoiceId) {
      throw new Error("Invoice ID is required to add a product");
    }

    if (isEditing && item) {
      await updateItem.mutateAsync({
        invoiceId: currentInvoiceId,
        itemId: item.id,
        data: dataWithTaxMode,
      });
      onSuccess(currentInvoiceId);
    } else {
      await createItem.mutateAsync({
        invoiceId: currentInvoiceId,
        data: dataWithTaxMode,
      });
      // Pass the invoiceId back in case it was just created
      onSuccess(currentInvoiceId);
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
              disabled={form.formState.isSubmitting || isCreatingInvoice}
            >
              {isCreatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Invoice...
                </>
              ) : form.formState.isSubmitting ? (
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
