"use client";

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
import { useCreateClientFromVoiceAudio } from "../hooks/useClients";

export type VoiceClientPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoiceClientPromptDialog({
  open,
  onOpenChange,
}: VoiceClientPromptDialogProps) {
  const voiceMutation = useCreateClientFromVoiceAudio();
  const isCreating = voiceMutation.isPending;
  const canRecord = !isCreating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Client by voice</DialogTitle>
          <DialogDescription>
            Record the client&apos;s name, email, and optional phone or address.
            You can edit details after creation.
          </DialogDescription>
        </DialogHeader>

        <VoiceAudioRecorder
          open={open}
          canRecord={canRecord}
          isSubmitting={isCreating}
          creatingLabel="Creating client..."
          stopLabel="Stop & create client"
          onSubmitAudio={({ audio, mimeType }) => {
            voiceMutation.mutate(
              { audio, mimeType },
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
            disabled={isCreating}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
