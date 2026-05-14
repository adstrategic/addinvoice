"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateEstimateDTO } from "@addinvoice/schemas";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

export function ExclusionsSection({ form }: { form: UseFormReturn<CreateEstimateDTO> }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Exclusions</CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={form.control}
          name="exclusions"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Exclusions</FieldLabel>
              <RichTextEditor
                value={field.value as Record<string, unknown> | null | undefined}
                onChange={field.onChange}
                placeholder="List anything explicitly excluded from the scope of work..."
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}
