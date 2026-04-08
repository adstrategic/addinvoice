"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { ClientSelector } from "@/components/shared/ClientSelector";
import type { UseFormReturn } from "react-hook-form";
import type { CreateEstimateDTO, EstimateResponse } from "@addinvoice/schemas";
import type { ClientResponse } from "@addinvoice/schemas";
import { useEstimateAutofill } from "../../hooks/useEstimateAutofill";
import { NumericFormat } from "react-number-format";

interface ClientSectionProps {
  form: UseFormReturn<CreateEstimateDTO>;
  estimate: EstimateResponse | null;
  initialClient: ClientResponse | null;
  mode: "create" | "edit";
}

export const ClientSection = ({
  form,
  estimate,
  initialClient,
  mode,
}: ClientSectionProps) => {
  const isCreateNewMode = form.watch("createClient") === true;
  const { handleClientSelect, selectedClient } = useEstimateAutofill({
    estimate: estimate,
    setValue: form.setValue,
  });

  // Set createClient flag based on mode
  useEffect(() => {
    if (isCreateNewMode) {
      form.setValue("clientEmail", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
      form.setValue("clientPhone", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
      form.setValue("clientAddress", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
    } else {
      form.setValue("createClient", false, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [isCreateNewMode, form]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <ClientSelector
              value={field.value || 0}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("createClient", false, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.resetField("clientData", { defaultValue: undefined });
              }}
              initialClient={initialClient}
              onSelect={(client) => {
                handleClientSelect(client);
              }}
              onCreateNew={() => {
                form.setValue("createClient", true, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue("clientId", 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
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
                along with this estimate.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NIT/ID */}
              <FormField
                control={form.control}
                name="clientData.nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT/ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter NIT or ID number..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Name */}
              <FormField
                control={form.control}
                name="clientData.businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter business name..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Name */}
              <FormField
                control={form.control}
                name="clientData.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Client Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter client name..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="clientData.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="Enter email..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="clientData.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <PhoneInputField
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter phone..."
                      />
                    </FormControl>
                    <PhoneHelp />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="clientData.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter address..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reminder before due (days) - optional */}
              <FormField
                control={form.control}
                name="clientData.reminderBeforeDueIntervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder before due (days)</FormLabel>
                    <FormControl>
                      <NumericFormat
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reminder after due (days) - optional */}
              <FormField
                control={form.control}
                name="clientData.reminderAfterDueIntervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder after due (days)</FormLabel>
                    <FormControl>
                      <NumericFormat
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Estimate-Specific Client Fields - shown when a client is selected */}
        {!isCreateNewMode && selectedClient && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <h3 className="text-base font-medium">
                Estimate Contact Information
              </h3>
              <p className="text-sm text-muted-foreground">
                These fields can differ from the client&apos;s default contact
                information for this specific estimate.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter email..."
                      className="mt-2"
                      {...field}
                    />
                    <FormMessage />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Phone
                    </label>
                    <div className="mt-2">
                      <PhoneInputField
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter phone..."
                      />
                    </div>
                    <PhoneHelp />
                    <FormMessage />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="clientAddress"
                render={({ field }) => (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Address
                    </label>
                    <Textarea
                      placeholder="Enter address..."
                      className="mt-2"
                      rows={2}
                      {...field}
                      value={field.value || ""}
                    />
                    <FormMessage />
                  </div>
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
