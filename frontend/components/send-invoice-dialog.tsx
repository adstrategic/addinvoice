"use client";

import { useState } from "react";
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
import { Send, Mail, LinkIcon, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceSequence?: number;
  invoiceNumber?: string;
  clientName: string;
  clientEmail?: string;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceSequence,
  invoiceNumber,
  clientName,
  clientEmail,
}: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(clientEmail || "");
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber}`);
  const [message, setMessage] = useState(
    `Dear ${clientName},\n\nPlease find attached invoice ${invoiceNumber}. Payment is due within 30 days.\n\nThank you for your business!`,
  );

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
      const response = await fetch(`/api/invoices/${invoiceSequence}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invoice");
      }

      setSending(false);
      setSent(true);
      toast({
        title: "Invoice sent",
        description: `Invoice has been sent to ${email}`,
      });
      setTimeout(() => {
        setSent(false);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setSending(false);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  // const handleCopyLink = () => {
  //   const link = `${window.location.origin}/invoices/${invoiceSequence}`;
  //   navigator.clipboard.writeText(link);
  //   toast({
  //     title: "Link copied",
  //     description: "Invoice link has been copied to clipboard",
  //   });
  // };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Invoice Sent Successfully!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              The invoice has been sent to {clientName}
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
          <DialogTitle>Send Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Choose how you want to send this invoice to {clientName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            {/* <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Link
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
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
                placeholder="Invoice from ADSTRATEGIC"
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
          </TabsContent>

          {/* <TabsContent value="link" className="space-y-4 mt-4">
            <div>
              <Label>Shareable Link</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/invoices/${invoiceSequence}`}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="bg-transparent"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this link with your client to view the invoice online
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent"
              >
                Close
              </Button>
            </DialogFooter>
          </TabsContent> */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
