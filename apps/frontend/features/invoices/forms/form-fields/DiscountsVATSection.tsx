"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";
import { NumericFormat } from "react-number-format";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface DiscountsVATSectionProps {
  form: UseFormReturn<CreateInvoiceDTO>;
}

export function DiscountsVATSection({ form }: DiscountsVATSectionProps) {
  const taxMode = form.watch("taxMode");
  const discountType = form.watch("discountType");

  const handleTaxModeChange = (newValue: string) => {
    if (!newValue) return;

    form.setValue("taxMode", newValue as "NONE" | "BY_PRODUCT" | "BY_TOTAL", {
      shouldDirty: true,
    });

    if (newValue !== "BY_TOTAL") {
      form.setValue("taxName", null, { shouldDirty: true });
      form.setValue("taxPercentage", null, { shouldDirty: true });
    }
  };

  const handleDiscountTypeChange = (newValue: string) => {
    if (!newValue) return;

    form.setValue("discountType", newValue as "NONE" | "PERCENTAGE" | "FIXED", {
      shouldDirty: true,
    });

    if (newValue === "NONE") {
      form.setValue("discount", 0, { shouldDirty: true });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Discounts & VAT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invoice-Level Discount */}
        <div className="space-y-4">
          <Controller
            control={form.control}
            name="discountType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Discount Type</FieldLabel>
                <Select
                  onValueChange={handleDiscountTypeChange}
                  value={field.value.toString()}
                >
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Discount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {discountType && discountType !== "NONE" && (
            <Controller
              control={form.control}
              name="discount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Discount{" "}
                    {discountType === "PERCENTAGE" ? "(%)" : "(Amount)"}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="number"
                    min="0"
                    step={discountType === "PERCENTAGE" ? "0.01" : "0.01"}
                    placeholder={discountType === "PERCENTAGE" ? "10" : "50.00"}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        </div>

        {/* Tax Configuration */}
        <div className="space-y-4 pt-4 border-t border-border">
          <Controller
            control={form.control}
            name="taxMode"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Tax Mode</FieldLabel>
                <Select
                  onValueChange={handleTaxModeChange}
                  value={field.value.toString()}
                >
                  <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select tax mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Tax</SelectItem>
                    <SelectItem value="BY_PRODUCT">By Product</SelectItem>
                    <SelectItem value="BY_TOTAL">By Total (VAT)</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {taxMode === "BY_PRODUCT"
                    ? "Fill the tax data on each item above"
                    : taxMode === "BY_TOTAL"
                      ? "Fill the tax data for the invoice below"
                      : "No tax data needed"}
                </FieldDescription>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {taxMode === "BY_TOTAL" && (
            <>
              <Controller
                control={form.control}
                name="taxName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Tax Name</FieldLabel>
                    <Input
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g., VAT, Sales Tax"
                      {...field}
                      value={field.value || ""}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="taxPercentage"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Tax Percentage (%)</FieldLabel>
                    <NumericFormat
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      value={field.value ?? ""}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? null);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      customInput={Input}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
