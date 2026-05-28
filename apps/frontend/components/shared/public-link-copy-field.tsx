"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { buildPublicDocumentUrl } from "@/lib/public-document-url";
import { toast } from "sonner";

interface PublicLinkCopyFieldProps {
  publicSlug: string;
}

export function PublicLinkCopyField({ publicSlug }: PublicLinkCopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const url = buildPublicDocumentUrl(publicSlug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="space-y-2">
      <InputGroup>
        <InputGroupInput readOnly value={url} className="font-mono text-sm" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label="Copy public link"
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <Check className="size-4 text-primary" />
            ) : (
              <Copy className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="text-xs text-muted-foreground">
        Share this link with your client to view and pay online.
      </p>
    </div>
  );
}
