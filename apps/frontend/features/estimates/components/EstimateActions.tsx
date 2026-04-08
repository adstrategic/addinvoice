import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

interface EstimateActionsProps {
  onCreateEstimate: () => void;
}

/**
 * Estimate actions component
 * Header actions for creating estimates
 */
export function EstimateActions({ onCreateEstimate }: EstimateActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <Link href="/voice">
        <Button
          variant="outline"
          className="gap-2 flex-1 md:flex-none cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          Add by voice
        </Button>
      </Link>
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
