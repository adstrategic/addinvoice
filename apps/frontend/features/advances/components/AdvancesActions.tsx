import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";

interface AdvanceActionsProps {
  onCreateAdvance: () => void;
  onCreateByVoice: () => void;
}

/**
 * Advance actions component
 * Header actions for creating estimates
 */
export function AdvanceActions({
  onCreateByVoice,
  onCreateAdvance,
}: AdvanceActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-4 w-4" />
        Add by voice
      </Button>
      <Button
        onClick={onCreateAdvance}
        size="lg"
        data-tour-id="advances-create-btn"
        className="cursor-pointer flex-1 md:flex-none gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
      >
        <Plus className="h-5 w-5" />
        Create Advance
      </Button>
    </div>
  );
}
