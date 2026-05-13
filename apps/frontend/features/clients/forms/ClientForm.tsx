"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { ContactFields } from "./form-fields/ContactFields";
import { ReminderFields } from "./form-fields/ReminderFields";
import { LogoUploadField } from "./form-fields/LogoUploadField";
import type { UseFormReturn } from "react-hook-form";
import type { CreateClientDTO } from "@addinvoice/schemas";

interface ClientFormProps {
  form: UseFormReturn<CreateClientDTO>;
  mode: "create" | "edit";
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  // Logo
  logoDisplayUrl: string | null;
  onLogoSelect: (file: File) => void;
  isUploadingLogo: boolean;
}

export function ClientForm({
  form,
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
  logoDisplayUrl,
  onLogoSelect,
  isUploadingLogo,
}: ClientFormProps) {
  const formTitle = mode === "create" ? "Create New Client" : "Edit Client";
  const submitButtonText =
    mode === "create" ? "Create Client" : "Update Client";

  const rootError = form.formState.errors.root;
  const isDirty = form.formState.isDirty;
  const clientName = form.watch("name") ?? "";

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{formTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Fill in the information below to create a new client."
              : "Update the client information below."}
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center py-2">
          <LogoUploadField
            logoDisplayUrl={logoDisplayUrl}
            clientName={clientName}
            onFileSelect={onLogoSelect}
            isUploading={isUploadingLogo}
          />
        </div>

        <Separator />

        {/* Root Error */}
        {rootError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Basic Information</h3>
            <p className="text-sm text-muted-foreground">
              Essential client details and identification.
            </p>
          </div>
          <BasicInfoFields
            mode={mode}
            control={form.control}
            isLoading={isLoading}
          />
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Contact Information</h3>
            <p className="text-sm text-muted-foreground">
              Phone numbers and email addresses for communication.
            </p>
          </div>
          <ContactFields control={form.control} isLoading={isLoading} />
        </div>

        <Separator />

        {/* Reminder settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Estimate reminders</h3>
            <p className="text-sm text-muted-foreground">
              Optional: how often to send payment reminders for this client.
            </p>
          </div>
          <ReminderFields control={form.control} isLoading={isLoading} />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                form.reset();
              }
            }}
            disabled={isLoading}
          >
            {onCancel ? "Cancel" : "Reset"}
          </Button>

          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>

        {/* Form Status Indicator */}
        {mode === "edit" && isDirty && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            * You have unsaved changes
          </div>
        )}
      </form>
    </Form>
  );
}
