"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { ClientSelector } from "@/components/shared/ClientSelector";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateAdvanceDTO } from "@addinvoice/schemas";
import type { ClientResponse } from "@addinvoice/schemas";
import { NumericFormat } from "react-number-format";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface ClientSectionProps {
  form: UseFormReturn<CreateAdvanceDTO>;
  initialClient: ClientResponse | null;
  mode: "create" | "edit";
  onSelectClient?: (client: ClientResponse) => void;
}

export const ClientSection = ({
  form,
  initialClient,
  mode,
  onSelectClient,
}: ClientSectionProps) => {
  const isCreateNewMode = form.watch("createClient") === true;

  return (
    <Card className="bg-card border-border mt-5">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Controller
          control={form.control}
          name="clientId"
          render={({ field, fieldState }) => (
            <ClientSelector
              fieldState={fieldState}
              value={field.value || 0}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("createClient", false, { shouldDirty: true });
                form.resetField("clientData", { defaultValue: undefined });
                if (value > 0) form.clearErrors("clientId");
              }}
              initialClient={initialClient}
              onSelect={onSelectClient}
              onCreateNew={() => {
                form.setValue("createClient", true, { shouldDirty: true });
                form.setValue("clientId", 0, { shouldDirty: true });
              }}
              mode={mode}
            />
          )}
        />

        {/* Client Creation Form - shown when "Create New Client" is selected */}
        {isCreateNewMode && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <h3 className="text-base font-medium">Create New Client</h3>
              <p className="text-sm text-muted-foreground">
                Fill in the client information below. The client will be created
                along with this advance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NIT/ID */}
              <Controller
                control={form.control}
                name="clientData.nit"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>NIT/ID</FieldLabel>
                    <Input
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter NIT or ID number..."
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Business Name */}
              <Controller
                control={form.control}
                name="clientData.businessName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Business Name</FieldLabel>
                    <Input
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter business name..."
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Client Name */}
              <Controller
                control={form.control}
                name="clientData.name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Client Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter client name..."
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                control={form.control}
                name="clientData.email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Email <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter email..."
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Phone */}
              <Controller
                control={form.control}
                name="clientData.phone"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <PhoneInputField
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Enter phone..."
                    />
                    <PhoneHelp />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Address */}
              <Controller
                control={form.control}
                name="clientData.address"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                    <Input
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter address..."
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Reminder before due (days) - optional */}
              <Controller
                control={form.control}
                name="clientData.reminderBeforeDueIntervalDays"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Reminder before due (days)</FieldLabel>
                    <NumericFormat
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                      placeholder="e.g. 3 (every 3 days)"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      customInput={Input}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Reminder after due (days) - optional */}
              <Controller
                control={form.control}
                name="clientData.reminderAfterDueIntervalDays"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Reminder after due (days)</FieldLabel>
                    <NumericFormat
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                      placeholder="e.g. 3 (every 3 days)"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      customInput={Input}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
