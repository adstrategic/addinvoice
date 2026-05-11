"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface TermsSectionProps {
  form: UseFormReturn<CreateInvoiceDTO>;
}

export function TermsSection({ form }: TermsSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Terms & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={form.control}
          name="terms"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Terms & Conditions</FieldLabel>
              <RichTextEditor
                value={field.value as Record<string, unknown> | null | undefined}
                onChange={field.onChange}
                placeholder="Payment terms, late fees, etc..."
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
