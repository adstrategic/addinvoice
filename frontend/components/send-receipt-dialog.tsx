"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentKeys } from "@/features/payments";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface SendReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: number;
  invoiceNumber: string;
  clientName: string;
  /** From invoice.clientEmail only (do not use client relation) */
  clientEmail?: string | null;
}

export function SendReceiptDialog({
  open,
  onOpenChange,
  paymentId,
  invoiceNumber,
  clientName,
  clientEmail,
}: SendReceiptDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(clientEmail ?? "");
  const [subject, setSubject] = useState(`Payment receipt - ${invoiceNumber}`);
  const [message, setMessage] = useState(
    "Please find your payment receipt attached.",
  );

  useEffect(() => {
    if (!open) {
      setEmail("");
      setSubject("");
      setMessage("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setEmail(clientEmail ?? "");
      setSubject(`Payment receipt - ${invoiceNumber}`);
      setMessage("Please find your payment receipt attached.");
    }
  }, [open, clientEmail, invoiceNumber]);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await apiClient.post(
        `/payments/${paymentId}/send-receipt`,
        {
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        },
      );

      const isAccepted = response.status === 202;
      setSending(false);
      setSent(true);
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      toast({
        title: "Receipt is being sent",
        description: isAccepted
          ? "The receipt will be sent shortly."
          : `Receipt has been sent to ${email}`,
      });
      setTimeout(() => {
        setSent(false);
        onOpenChange(false);
      }, 2000);
    } catch (error: unknown) {
      setSending(false);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send receipt",
        variant: "destructive",
      });
    }
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Receipt Sent Successfully!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              The receipt is being sent to {clientName}. It will arrive shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send receipt – {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Send the payment receipt to {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
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
              placeholder="Payment receipt"
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent"
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sending}
              className="gap-2"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
