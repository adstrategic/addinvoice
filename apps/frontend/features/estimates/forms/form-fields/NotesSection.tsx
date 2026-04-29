"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
              <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
              <Textarea
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Add any additional notes or comments..."
                rows={3}
                {...field}
                value={field.value || ""}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
