"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { proposalResponseSchema } from "@addinvoice/schemas"
import type { ApiSuccessResponse } from "@/lib/api/types"
import type { ProposalResponse } from "@addinvoice/schemas"
import { proposalKeys } from "@/features/proposals"
import { estimateKeys } from "@/features/estimates"
import { toast } from "sonner"

interface ConvertToProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estimateSequence: number
  estimateNumber: string
  clientName: string
  clientEmail?: string
  requireSignature?: boolean
}

export function ConvertToProposalDialog({
  open,
  onOpenChange,
  estimateSequence,
  estimateNumber,
  clientName,
  clientEmail,
  requireSignature: defaultRequireSignature = true,
}: ConvertToProposalDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState(false)
  const [email, setEmail] = useState(clientEmail || "")
  const [subject, setSubject] = useState(`Proposal for ${estimateNumber}`)
  const [message, setMessage] = useState(
    `Dear ${clientName},\n\nPlease find attached our proposal ${estimateNumber}. We look forward to working with you.\n\nThank you for your business!`,
  )
  const [askForSignature, setAskForSignature] = useState(defaultRequireSignature)

  useEffect(() => {
    if (!open) {
      setEmail("")
      setSubject("")
      setMessage("")
      setAskForSignature(defaultRequireSignature)
    }
  }, [open, defaultRequireSignature])

  useEffect(() => {
    if (open) {
      setEmail(clientEmail || "")
      setSubject(`Proposal for ${estimateNumber}`)
      setMessage(
        `Dear ${clientName},\n\nPlease find attached our proposal ${estimateNumber}. We look forward to working with you.\n\nThank you for your business!`,
      )
      setAskForSignature(defaultRequireSignature)
    }
  }, [open, clientEmail, estimateNumber, clientName, defaultRequireSignature])

  const handleConvert = async () => {
    if (!email.trim()) {
      toast.error("Please enter a recipient email address")
      return
    }

    setConverting(true)
    try {
      const response = await apiClient.post<ApiSuccessResponse<ProposalResponse>>(
        `/proposals/from-estimate/${estimateSequence}`,
        {
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          requireSignature: askForSignature,
        },
      )

      const proposal = proposalResponseSchema.parse(response.data.data)

      setConverting(false)
      setConverted(true)

      queryClient.invalidateQueries({ queryKey: estimateKeys.all })
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })

      toast.success("Proposal created and being sent", {
        description: `Proposal ${proposal.proposalNumber} is being sent to ${email}`,
      })

      setTimeout(() => {
        setConverted(false)
        onOpenChange(false)
        router.push(`/proposals/${proposal.sequence}`)
      }, 2000)
    } catch (error: unknown) {
      setConverting(false)
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null
      toast.error("Failed to convert estimate", {
        description:
          msg ||
          (error instanceof Error ? error.message : "Failed to convert estimate"),
      })
    }
  }

  if (converted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Proposal Created!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              The proposal is being sent to {clientName}. Redirecting…
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert Estimate {estimateNumber} to Proposal</DialogTitle>
          <DialogDescription>
            Send the new proposal to {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Recipient Email</Label>
            <Input
              type="email"
              placeholder="client@example.com"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              placeholder="Proposal from your company"
              className="mt-1"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="Add a personal message..."
              className="mt-1"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="ask-signature"
              checked={askForSignature}
              onCheckedChange={(checked) => setAskForSignature(checked === true)}
            />
            <Label htmlFor="ask-signature" className="cursor-pointer font-normal">
              Ask customer to sign this proposal
            </Label>
          </div>
          {askForSignature && (
            <p className="text-xs text-muted-foreground pl-6">
              A secure signing link will be included in the email so the customer can review and sign the proposal online.
            </p>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent"
            disabled={converting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="gap-2"
          >
            {converting ? (
              <>Converting...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Convert &amp; Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
