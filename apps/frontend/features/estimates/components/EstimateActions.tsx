import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";

interface EstimateActionsProps {
  onCreateEstimate: () => void;
  onCreateByVoice: () => void;
}

/**
 * Estimate actions component
 * Header actions for creating estimates
 */
export function EstimateActions({
  onCreateByVoice,
  onCreateEstimate,
}: EstimateActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <Button
        type="button"
        variant="outline"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-4 w-4" />
        Add by voice
      </Button>
      <div className="flex-1 sm:flex-none" data-tour-id="estimates-create-btn">
        <Button
          onClick={onCreateEstimate}
          size="lg"
          className="cursor-pointer gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          Create Estimate
        </Button>
      </div>
    </div>
  );
}
