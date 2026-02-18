import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

interface CatalogActionsProps {
  onOpenCreateModal: () => void;
}

export function CatalogActions({ onOpenCreateModal }: CatalogActionsProps) {
  return (
    <div className="flex gap-3 w-full md:w-auto">
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
