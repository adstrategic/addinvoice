"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import type { BusinessResponse } from "@addinvoice/schemas";
import { ClientSelector } from "@/components/shared/ClientSelector";
import { useCreateInvoiceFromVoiceAudio } from "../hooks/useInvoices";
import { VoiceAudioRecorder } from "@/components/voice-agent/VoiceAudioRecorder";

type VoiceClientForm = {
  clientId: number;
};

export type VoiceInvoicePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessResponse | null;
};

/**
 * Record audio with MediaRecorder (cross-browser), send to backend for
 * Whisper transcription → Claude invoice creation. No transcript review step.
 */
export function VoiceInvoicePromptDialog({
  open,
  onOpenChange,
  business,
}: VoiceInvoicePromptDialogProps) {
  const voiceMutation = useCreateInvoiceFromVoiceAudio();

  const form = useForm<VoiceClientForm>({
    defaultValues: { clientId: 0 },
  });
  const clientId = form.watch("clientId");

  useEffect(() => {
    if (!open) {
      form.reset({ clientId: 0 });
    }
  }, [open, form]);

  const isCreatingInvoice = voiceMutation.isPending;
  const canRecord = Boolean(business) && clientId > 0 && !isCreatingInvoice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice by voice</DialogTitle>
          <DialogDescription>
            Choose the customer, then click the recording button and describe
            the invoice.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <ClientSelector
                initialClient={null}
                mode="create"
                showCreateNew={false}
                value={field.value || 0}
                onValueChange={(v) => field.onChange(v)}
              />
            )}
          />
        </FormProvider>

        <VoiceAudioRecorder
          open={open}
          canRecord={canRecord}
          isSubmitting={isCreatingInvoice}
          creatingLabel="Creating invoice..."
          stopLabel="Stop & create invoice"
          onSubmitAudio={({ audio, mimeType }) => {
            const selectedClientId = form.getValues("clientId");
            if (!business || !selectedClientId) return;
            voiceMutation.mutate({
              businessId: business.id,
              clientId: selectedClientId,
              audio,
              mimeType,
            });
          }}
        />

        <DialogFooter className="pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingInvoice}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
