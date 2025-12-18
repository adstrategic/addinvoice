"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { FormField, FormMessage } from "@/components/ui/form";
import { ClientSelector } from "@/components/shared/ClientSelector";
import type { UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";
import type { ClientResponse } from "@/features/clients";

interface ClientSectionProps {
  form: UseFormReturn<CreateInvoiceDTO>;
  initialClient?: ClientResponse | null;
}

export function ClientSection({ form, initialClient }: ClientSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <ClientSelector
              field={{
                value: field.value || 0,
                onChange: (value) => field.onChange(value),
              }}
              initialClient={initialClient || null}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}
