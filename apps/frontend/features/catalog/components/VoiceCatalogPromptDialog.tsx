"use client";

import type { BusinessResponse } from "@addinvoice/schemas";

import { VoiceAudioRecorder } from "@/components/voice-agent/VoiceAudioRecorder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCatalogFromVoiceAudio } from "../hooks/useCatalogs";

export type VoiceCatalogPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessResponse | null;
};

export function VoiceCatalogPromptDialog({
  open,
  onOpenChange,
  business,
}: VoiceCatalogPromptDialogProps) {
  const voiceMutation = useCreateCatalogFromVoiceAudio();
  const isCreatingCatalog = voiceMutation.isPending;
  const canRecord = Boolean(business) && !isCreatingCatalog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Catalog item by voice</DialogTitle>
          <DialogDescription>
            Record one item name, description, and price. You can edit it after
            creation.
          </DialogDescription>
        </DialogHeader>

        <VoiceAudioRecorder
          open={open}
          canRecord={canRecord}
          isSubmitting={isCreatingCatalog}
          creatingLabel="Creating catalog item..."
          stopLabel="Stop & create item"
          onSubmitAudio={({ audio, mimeType }) => {
            if (!business) return;
            voiceMutation.mutate(
              {
                businessId: business.id,
                audio,
                mimeType,
              },
              {
                onSuccess: () => {
                  onOpenChange(false);
                },
              },
            );
          }}
        />

        <DialogFooter className="pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingCatalog}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
