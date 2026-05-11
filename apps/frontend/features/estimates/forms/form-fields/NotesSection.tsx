"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateEstimateDTO } from "@addinvoice/schemas";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface NotesSectionProps {
  form: UseFormReturn<CreateEstimateDTO>;
}

export function NotesSection({ form }: NotesSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Additional Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Notes</FieldLabel>
              <RichTextEditor
                value={field.value as Record<string, unknown> | null | undefined}
                onChange={field.onChange}
                placeholder="Add any additional notes or comments..."
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
