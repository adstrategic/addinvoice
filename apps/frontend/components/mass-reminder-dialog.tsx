"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type PendingInvoice = {
  id: number
  invoiceNumber: string
  clientName: string
  companyName: string
  total: number
  dueDate: string
  status: string
}

type MassReminderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MassReminderDialog({ open, onOpenChange }: MassReminderDialogProps) {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([])
  const [messageTemplate, setMessageTemplate] = useState(
    "Hello {clientName},\n\nThis is a friendly reminder from {companyName} that invoice #{invoiceNumber} with an amount of ${amount} was due on {dueDate} and is currently pending payment.\n\nWe kindly request that you process this payment at your earliest convenience. If you have any questions or concerns, please don't hesitate to contact us.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\n{companyName}",
  )
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadPendingInvoices()
    }
  }, [open])

  const loadPendingInvoices = () => {
    const emitted = localStorage.getItem("emittedInvoices")
    if (emitted) {
      const invoices = JSON.parse(emitted)
      const pending = invoices.filter((inv: any) => inv.status === "overdue" || inv.status === "issued")
      setPendingInvoices(pending)
    }
  }

  const generatePersonalizedMessage = (invoice: PendingInvoice) => {
    return messageTemplate
      .replace(/{clientName}/g, invoice.clientName)
      .replace(/{companyName}/g, invoice.companyName)
      .replace(/{invoiceNumber}/g, invoice.invoiceNumber)
      .replace(/{dueDate}/g, invoice.dueDate)
      .replace(/{amount}/g, invoice.total.toFixed(2))
  }

  const handleSendReminders = () => {
    setShowSuccess(true)

    setTimeout(() => {
      setShowSuccess(false)
      onOpenChange(false)
      toast({
        title: "Reminders sent successfully",
        description: `${pendingInvoices.length} reminder${pendingInvoices.length > 1 ? "s" : ""} sent to clients`,
      })
    }, 2000)
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Reminders Sent!</DialogTitle>
            <DialogDescription className="text-center">
              {pendingInvoices.length} personalized reminder{pendingInvoices.length > 1 ? "s have" : " has"} been sent
              successfully
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Send Mass Reminders</DialogTitle>
          <DialogDescription>
            Send personalized payment reminders to all clients with pending invoices
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <Label>Message Template</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Use variables: {"{clientName}"}, {"{companyName}"}, {"{invoiceNumber}"}, {"{dueDate}"}, {"{amount}"}
              </p>
              <Textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">Recipients</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {pendingInvoices.length} client{pendingInvoices.length > 1 ? "s" : ""} with pending invoices
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{invoice.clientName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{invoice.invoiceNumber}</span>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                        ${invoice.total.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <h4 className="font-semibold text-foreground mb-3">Preview Personalized Messages</h4>
            <ScrollArea className="flex-1 border border-border rounded-lg">
              <div className="p-4 space-y-4">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-secondary/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{invoice.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.invoiceNumber} • ${invoice.total.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <div className="bg-background rounded p-3 text-sm text-foreground whitespace-pre-wrap font-mono">
                      {generatePersonalizedMessage(invoice)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {showPreview ? (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Edit
              </Button>
              <Button onClick={handleSendReminders} className="gap-2">
                <Send className="h-4 w-4" />
                Send {pendingInvoices.length} Reminder{pendingInvoices.length > 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowPreview(true)} disabled={pendingInvoices.length === 0}>
                Preview Messages ({pendingInvoices.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
