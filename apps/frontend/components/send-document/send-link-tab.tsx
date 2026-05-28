"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Link2, Loader2 } from "lucide-react";
import { PublicLinkCopyField } from "@/components/shared/public-link-copy-field";
import { useSharePublicLink } from "@/features/public-documents/hooks/useSharePublicLink";
import type { SharePublicLinkResource } from "@/features/public-documents/service/share-public-link.service";

export type SendLinkDocumentResource = SharePublicLinkResource;

interface SendLinkTabProps {
  resource: SendLinkDocumentResource;
  sequence: number;
  documentLabel: string;
  initialPublicSlug?: string | null;
  queryKeysToInvalidate: readonly (readonly unknown[])[];
  onShared?: () => void;
  onClose: () => void;
}

export function SendLinkTab({
  resource,
  sequence,
  documentLabel,
  initialPublicSlug,
  queryKeysToInvalidate,
  onShared,
  onClose,
}: SendLinkTabProps) {
  const { mutate, isPending, data } = useSharePublicLink({
    resource,
    sequence,
    documentLabel,
    queryKeysToInvalidate,
    onShared,
  });

  const publicSlug = initialPublicSlug ?? data?.publicSlug ?? null;
  const showLink = !!publicSlug;

  return (
    <div className="space-y-4 mt-4">
      {showLink ? (
        <PublicLinkCopyField publicSlug={publicSlug} />
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate a secure link your client can use to view this{" "}
            {documentLabel.toLowerCase()} and take action (pay or accept).
          </p>
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing link...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Share public link
              </>
            )}
          </Button>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-transparent"
        >
          {showLink ? "Done" : "Cancel"}
        </Button>
      </DialogFooter>
    </div>
  );
}
