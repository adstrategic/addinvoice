"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogCard } from "./CatalogCard";
import type { CatalogResponse } from "@/features/catalog";
import { cn } from "@/lib/utils";

interface CatalogListProps {
  catalogs: CatalogResponse[];
  isLoading?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (catalog: CatalogResponse) => void;
  onAddNew: () => void;
  children?: React.ReactNode;
}

function CatalogListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading catalog">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CatalogList({
  catalogs,
  isLoading = false,
  onEdit,
  onDelete,
  onAddNew,
  children,
}: CatalogListProps) {
  return (
    <div
      data-tour-id="catalog-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <CatalogListSkeleton />
      ) : catalogs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-secondary/20">
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
      ) : (
        <div className="space-y-3">
          {catalogs.map((catalog) => (
            <CatalogCard
              key={catalog.id}
              catalog={catalog}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
