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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";
import { NumericFormat } from "react-number-format";

interface DiscountsVATSectionProps {
  form: UseFormReturn<CreateInvoiceDTO>;
}

export function DiscountsVATSection({ form }: DiscountsVATSectionProps) {
  const taxMode = form.watch("taxMode");
  const discountType = form.watch("discountType");

  // Handle taxMode change - clear tax fields when switching away from BY_TOTAL
  const handleTaxModeChange = (newValue: string) => {
    if (!newValue) return;

    form.setValue("taxMode", newValue as "NONE" | "BY_PRODUCT" | "BY_TOTAL", {
      shouldDirty: true,
    });

    // Clear taxName and taxPercentage when switching to non-BY_TOTAL modes
    if (newValue !== "BY_TOTAL") {
      form.setValue("taxName", null, { shouldDirty: true });
      form.setValue("taxPercentage", null, { shouldDirty: true });
    }
  };

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
          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  onValueChange={handleDiscountTypeChange}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">No Discount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {discountType && discountType !== "NONE" && (
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Discount{" "}
                    {discountType === "PERCENTAGE" ? "(%)" : "(Amount)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={discountType === "PERCENTAGE" ? "0.01" : "0.01"}
                      placeholder={
                        discountType === "PERCENTAGE" ? "10" : "50.00"
                      }
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Tax Configuration */}
        <div className="space-y-4 pt-4 border-t border-border">
          <FormField
            control={form.control}
            name="taxMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Mode</FormLabel>
                <Select
                  onValueChange={handleTaxModeChange}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">No Tax</SelectItem>
                    <SelectItem value="BY_PRODUCT">By Product</SelectItem>
                    <SelectItem value="BY_TOTAL">By Total (VAT)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {taxMode === "BY_PRODUCT"
                    ? "Fill the tax data on each item above"
                    : taxMode === "BY_TOTAL"
                      ? "Fill the tax data for the invoice below"
                      : "No tax data needed"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {taxMode === "BY_TOTAL" && (
            <>
              <FormField
                control={form.control}
                name="taxName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., VAT, Sales Tax"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Percentage (%)</FormLabel>
                    <FormControl>
                      <NumericFormat
                        id="taxPercentage"
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
