"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";

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
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Payment terms, late fees, etc..."
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
