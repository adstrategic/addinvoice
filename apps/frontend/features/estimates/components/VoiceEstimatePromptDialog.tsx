"use client"

import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"
import type { BusinessResponse } from "@addinvoice/schemas"

import { ClientSelector } from "@/components/shared/ClientSelector"
import { VoiceAudioRecorder } from "@/components/voice-agent/VoiceAudioRecorder"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/ui/form"
import { useCreateEstimateFromVoiceAudio } from "../hooks/useEstimates"

type VoiceClientForm = {
  clientId: number
}

export type VoiceEstimatePromptDialogProps = {
  business: BusinessResponse | null
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function VoiceEstimatePromptDialog({
  business,
  onOpenChange,
  open,
}: VoiceEstimatePromptDialogProps) {
  const voiceMutation = useCreateEstimateFromVoiceAudio()
  const form = useForm<VoiceClientForm>({
    defaultValues: { clientId: 0 },
  })
  const clientId = form.watch("clientId")

  useEffect(() => {
    if (!open) {
      form.reset({ clientId: 0 })
    }
  }, [form, open])

  const isCreatingEstimate = voiceMutation.isPending
  const canRecord = Boolean(business) && clientId > 0 && !isCreatingEstimate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Estimate by voice</DialogTitle>
          <DialogDescription>
            Choose the customer, then click the recording button and describe the
            estimate.
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
          isSubmitting={isCreatingEstimate}
          creatingLabel="Creating estimate..."
          stopLabel="Stop & create estimate"
          onSubmitAudio={({ audio, mimeType }) => {
            const selectedClientId = form.getValues("clientId")
            if (!business || !selectedClientId) return
            voiceMutation.mutate({
              businessId: business.id,
              clientId: selectedClientId,
              audio,
              mimeType,
            })
          }}
        />

        <DialogFooter className="pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingEstimate}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
