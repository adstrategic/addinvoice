import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";

interface CatalogActionsProps {
  onOpenCreateModal: () => void;
  onCreateByVoice: () => void;
}

export function CatalogActions({
  onCreateByVoice,
  onOpenCreateModal,
}: CatalogActionsProps) {
  return (
    <div className="flex gap-3 w-full md:w-auto">
      <Button
        type="button"
        variant="outline"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-4 w-4" />
        Add by voice
      </Button>
      <div data-tour-id="catalog-create-btn">
        <Button
          className="gap-2 flex-1 md:flex-none"
          onClick={onOpenCreateModal}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
