"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, Mic } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

const DEFAULT_MAX_RECORDING_MS = 5 * 60 * 1000
const WAVEFORM_BAR_COUNT = 28

function VoiceRecordingWaveform({ levels }: { levels: number[] }) {
  return (
    <div
      className="flex h-18 max-w-38 items-center justify-center gap-[2px]"
      aria-hidden
    >
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-[3px] shrink-0 rounded-full bg-primary/75"
          style={{ height: `${Math.max(8, Math.round(6 + level * 54))}px` }}
        />
      ))}
    </div>
  )
}

export type VoiceAudioRecorderProps = {
  canRecord: boolean
  creatingLabel?: string
  isSubmitting: boolean
  maxRecordingMs?: number
  onSubmitAudio: (payload: { audio: Blob; mimeType: string }) => void
  open: boolean
  startLabel?: string
  stopLabel?: string
}

export function VoiceAudioRecorder({
  canRecord,
  creatingLabel = "Creating...",
  isSubmitting,
  maxRecordingMs = DEFAULT_MAX_RECORDING_MS,
  onSubmitAudio,
  open,
  startLabel = "Start Recording",
  stopLabel = "Stop & create",
}: VoiceAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [waveLevels, setWaveLevels] = useState<number[]>(() =>
    Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.1),
  )
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldSubmitRef = useRef(false)
  const mimeTypeRef = useRef("audio/webm;codecs=opus")

  const cleanup = useCallback(() => {
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
    void audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    setIsRecording(false)
    setWaveLevels(Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.1))
  }, [])

  useEffect(() => {
    if (!open) {
      cleanup()
    }
  }, [cleanup, open])

  useEffect(() => {
    if (!isRecording || !analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let rafId = 0

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const voiceEnd = Math.floor(bufferLength * 0.82)
      const next: number[] = []
      for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
        const t0 = Math.floor((i / WAVEFORM_BAR_COUNT) * voiceEnd)
        const t1 = Math.floor(((i + 1) / WAVEFORM_BAR_COUNT) * voiceEnd)
        let peak = 0
        for (let j = t0; j < t1; j++) {
          const v = dataArray[j] ?? 0
          if (v > peak) peak = v
        }
        next.push(Math.max(0.06, peak / 255))
      }
      setWaveLevels(next)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      void audioContextRef.current?.close()
      audioContextRef.current = null
      analyserRef.current = null
    }
  }, [isRecording])

  const handleStopAndSubmit = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
    }
    shouldSubmitRef.current = true
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
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

    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (AudioContextCtor) {
      const audioCtx = new AudioContextCtor()
      if (audioCtx.state === "suspended") {
        await audioCtx.resume()
      }
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.65
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      audioContextRef.current = audioCtx
      analyserRef.current = analyser
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/mp4"
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      if (!shouldSubmitRef.current) return
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      if (blob.size === 0) return
      onSubmitAudio({ audio: blob, mimeType: mimeTypeRef.current })
    }

    recorder.start()
    setIsRecording(true)
    autoStopTimerRef.current = setTimeout(handleStopAndSubmit, maxRecordingMs)
  }, [handleStopAndSubmit, maxRecordingMs, onSubmitAudio])

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {isRecording ? (
        <div className="flex flex-col items-center justify-center">
          <span className="flex min-h-0 flex-1 items-center justify-center">
            <VoiceRecordingWaveform levels={waveLevels} />
          </span>
          <Button
            type="button"
            variant="secondary"
            className="h-44 w-44 flex-col gap-0 rounded-full px-3 py-2"
            onClick={handleStopAndSubmit}
            disabled={isSubmitting}
          >
            <Check className="size-8!" color="green" />
            <span className="max-w-40 pb-1 text-center text-[11px] font-medium leading-snug text-muted-foreground">
              {stopLabel}
            </span>
          </Button>
        </div>
      ) : isSubmitting ? (
        <div
          className="relative flex h-44 w-44 shrink-0 flex-col items-center justify-center gap-8"
          role="status"
          aria-live="polite"
          aria-label={creatingLabel}
        >
          <Image
            src="/images/addstrategic-icon.png"
            className="animate-spin rounded-full"
            alt="AdStrategic"
            width={100}
            height={100}
          />
          <span className="text-sm font-medium text-foreground">{creatingLabel}</span>
        </div>
      ) : (
        <Button
          type="button"
          className="flex h-44 w-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-full"
          onClick={startRecording}
          disabled={!canRecord}
        >
          <Mic className="size-12!" />
          {startLabel}
        </Button>
      )}
    </div>
  )
}
