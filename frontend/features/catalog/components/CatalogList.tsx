"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogCard } from "./CatalogCard";
import type { CatalogResponse } from "@/features/catalog";

interface CatalogListProps {
  catalogs: CatalogResponse[];
  onEdit: (sequence: number) => void;
  onDelete: (catalog: CatalogResponse) => void;
  onAddNew: () => void;
  children?: React.ReactNode;
}

/**
 * Catalog list component
 * Displays a grid of catalog items with empty state handling
 */
export function CatalogList({
  catalogs,
  onEdit,
  onDelete,
  onAddNew,
  children,
}: CatalogListProps) {
  if (catalogs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-secondary/20">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No items found</h3>
        <p className="text-muted-foreground mb-6">
          Your catalog is empty. Add your first product or service.
        </p>
        <Button onClick={onAddNew}>
          <Package className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalogs.map((catalog) => (
          <CatalogCard
            key={catalog.id}
            catalog={catalog}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      {children}
    </>
  );
}

