import { Button } from "@/components/ui/button";
import { Plus, Mic, Pencil, Calculator, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EstimateActionsProps {
  onCreateEstimate: () => void;
  onCreateByVoice: () => void;
  onOpenCalculator: () => void;
}

/**
 * Estimate actions component
 * Header actions for creating estimates
 */
export function EstimateActions({
  onCreateByVoice,
  onCreateEstimate,
  onOpenCalculator,
}: EstimateActionsProps) {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="lg"
            data-tour-id="estimates-create-btn"
            className="cursor-pointer flex-1 md:flex-none gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            Create Estimate
            <ChevronDown className="h-4 w-4 opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onCreateEstimate} className="gap-2">
            <Pencil className="h-4 w-4" />
            Manual
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenCalculator} className="gap-2">
            <Calculator className="h-4 w-4" />
            Use calculator
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
