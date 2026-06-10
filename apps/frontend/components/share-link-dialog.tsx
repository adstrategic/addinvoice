"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentType: "invoice" | "estimate" | "advance" | "review";
  clientName?: string;
  customUrl?: string;
  onClose?: () => void;
}

export function ShareLinkDialog({
  open,
  onOpenChange,
  documentId,
  documentType,
  clientName,
  customUrl,
  onClose,
}: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  // Generate the public link
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // Using prefix to identify type: inv-, est-, adv-
  const prefix =
    documentType === "invoice"
      ? "inv"
      : documentType === "estimate"
        ? "est"
        : documentType === "advance"
          ? "adv"
          : "rev";
  const shareLink = customUrl || `${origin}/p/${prefix}-${documentId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied!", {
      description: "The link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `Hello ${clientName || ""}! Here is your ${documentType}. You can view it securely here: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = `Your ${documentType} is ready`;
    const body = `Hello ${clientName || ""},\n\nHere is the link to view your ${documentType}: \n\n${shareLink}\n\nThank you!`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val && onClose) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {documentType.charAt(0).toUpperCase() + documentType.slice(1)} Ready
            to Share!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your document has been generated successfully. Share this link with
            your client so they can view and interact with it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <Input
            value={shareLink}
            readOnly
            className="flex-1 bg-secondary/50 font-mono text-xs"
          />
          <Button
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
            variant={copied ? "default" : "secondary"}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={handleEmail} variant="outline" className="w-full">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>

        <DialogFooter className="sm:justify-between mt-6">
          <Link
            href={shareLink}
            target="_blank"
            className="text-sm text-primary flex items-center hover:underline"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Preview Portal
          </Link>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
