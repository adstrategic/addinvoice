"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2 } from "lucide-react";
import { PublicLinkCopyField } from "@/components/shared/public-link-copy-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CopyPublicLinkButtonProps {
  publicSlug?: string | null;
  /** When false, the control is hidden (e.g. draft documents). */
  isIssued?: boolean;
  /** Use dialog with full copy field instead of icon-only quick copy */
  variant?: "icon" | "dialog";
}

export function CopyPublicLinkButton({
  publicSlug,
  isIssued = false,
  variant = "icon",
}: CopyPublicLinkButtonProps) {
  if (!publicSlug || !isIssued) return null;

  if (variant === "dialog") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Link2 className="h-4 w-4" />
            Public link
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Public share link</DialogTitle>
          </DialogHeader>
          <PublicLinkCopyField publicSlug={publicSlug} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-transparent"
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Public share link</DialogTitle>
            </DialogHeader>
            <PublicLinkCopyField publicSlug={publicSlug} />
          </DialogContent>
        </Dialog>
      </TooltipTrigger>
      <TooltipContent>
        <p>Copy public link</p>
      </TooltipContent>
    </Tooltip>
  );
}
