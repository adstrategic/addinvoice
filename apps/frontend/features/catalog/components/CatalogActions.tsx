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
    <div className="flex gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-5 w-5" />
        Add by voice
      </Button>
      <Button
        className="cursor-pointer flex-1 md:flex-none gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        onClick={onOpenCreateModal}
        data-tour-id="catalog-create-btn"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Add new product
      </Button>
    </div>
  );
}
