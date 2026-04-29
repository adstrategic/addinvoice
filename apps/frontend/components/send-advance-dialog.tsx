"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
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
import type { SendAdvanceDTO } from "@addinvoice/schemas";

interface SendAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advanceId: number;
  projectName: string;
  clientName: string;
  clientEmail?: string | null;
  onSend: (params: { advanceId: number; payload: SendAdvanceDTO }) => Promise<void>;
  sending: boolean;
}

export function SendAdvanceDialog({
  open,
  onOpenChange,
  advanceId,
  projectName,
  clientName,
  clientEmail,
  onSend,
  sending,
}: SendAdvanceDialogProps) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(clientEmail ?? "");
  const [subject, setSubject] = useState(`Work advance - ${projectName}`);
  const [message, setMessage] = useState(
    `Hi ${clientName},\n\nPlease find attached the latest work advance for ${projectName}.`,
  );

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setEmail(clientEmail ?? "");
    setSubject(`Work advance - ${projectName}`);
    setMessage(
      `Hi ${clientName},\n\nPlease find attached the latest work advance for ${projectName}.`,
    );
  }, [open, clientEmail, clientName, projectName]);

  const handleSubmit = async () => {
    await onSend({
      advanceId,
      payload: {
        email: email.trim(),
        message: message.trim(),
        subject: subject.trim(),
      },
    });
    setSent(true);
    setTimeout(() => onOpenChange(false), 1500);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Advance queued for delivery
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              Your advance is being sent to {clientName}.
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
          <DialogTitle>Send Work Advance</DialogTitle>
          <DialogDescription>
            Confirm email details before sending this advance to {clientName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="client@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>
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
          <Button onClick={handleSubmit} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send Advance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
