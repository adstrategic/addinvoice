import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

interface CatalogActionsProps {
  onOpenCreateModal: () => void;
}

export function CatalogActions({ onOpenCreateModal }: CatalogActionsProps) {
  return (
    <div className="flex gap-3 w-full md:w-auto">
      <Link href="/catalog/voice">
        <Button variant="outline" className="gap-2 flex-1 md:flex-none w-full">
          <Mic className="h-4 w-4" />
          Catalog by Voice
        </Button>
      </Link>
      <Button className="gap-2 flex-1 md:flex-none" onClick={onOpenCreateModal}>
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}

