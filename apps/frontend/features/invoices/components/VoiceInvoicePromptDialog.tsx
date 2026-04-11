"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form"
import { Loader2, Mic, Square } from "lucide-react"
import type { BusinessResponse } from "@addinvoice/schemas"
import { ClientSelector } from "@/components/shared/ClientSelector"
import { useCreateInvoiceFromVoiceAudio } from "../hooks/useInvoices"
import { toast } from "sonner"

const MAX_RECORDING_MS = 5 * 60 * 1000 // 5 minutes

type VoiceClientForm = {
  clientId: number
}

export type VoiceInvoicePromptDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: BusinessResponse | null
}

/**
 * Record audio with MediaRecorder (cross-browser), send to backend for
 * Whisper transcription → Claude invoice creation. No transcript review step.
 */
export function VoiceInvoicePromptDialog({
  open,
  onOpenChange,
  business,
}: VoiceInvoicePromptDialogProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // When true, onstop fires the mutation. False during cleanup (dialog close).
  const shouldSubmitRef = useRef(false)
  const voiceMutation = useCreateInvoiceFromVoiceAudio()

  const form = useForm<VoiceClientForm>({
    defaultValues: { clientId: 0 },
  })
  const clientId = form.watch("clientId")

  // Release mic and reset state when dialog closes
  useEffect(() => {
    if (!open) {
      shouldSubmitRef.current = false
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current)
        autoStopTimerRef.current = null
      }
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      mediaRecorderRef.current = null
      chunksRef.current = []
      setIsRecording(false)
      form.reset({ clientId: 0 })
    }
  }, [open, form])

  const handleStopAndSubmit = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
    }
    shouldSubmitRef.current = true
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current?.stop() // triggers onstop → mutation
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    if (!business) return

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast.error("Microphone access denied", {
        description: "Allow microphone access in your browser settings.",
      })
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    shouldSubmitRef.current = false

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/mp4"

    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      if (!shouldSubmitRef.current) return
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const selectedClientId = form.getValues("clientId")
      if (!business || !selectedClientId) return
      voiceMutation.mutate({
        businessId: business.id,
        clientId: selectedClientId,
        audio: blob,
        mimeType,
      })
    }

    recorder.start()
    setIsRecording(true)

    autoStopTimerRef.current = setTimeout(handleStopAndSubmit, MAX_RECORDING_MS)
  }, [business, form, voiceMutation, handleStopAndSubmit])

  const busy = voiceMutation.isPending
  const canRecord = Boolean(business) && clientId > 0 && !busy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice by voice</DialogTitle>
          <DialogDescription>
            {business
              ? `Business: ${business.name}. Choose the customer, then describe line items, quantities, and prices.`
              : "Select a business first."}
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

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {isRecording ? (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="gap-2 rounded-full"
              onClick={handleStopAndSubmit}
              disabled={busy}
            >
              <Square className="h-4 w-4" />
              Stop & Create Invoice
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="gap-2 rounded-full"
              onClick={startRecording}
              disabled={!canRecord}
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}
          {busy && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating invoice…
            </span>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
