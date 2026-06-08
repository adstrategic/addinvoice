"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvanceCard } from "./AdvancesCard";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";
import { cn } from "@/lib/utils";

interface AdvanceListProps {
  advances: AdvanceListItemResponse[];
  isLoading?: boolean;
  onDelete: (advance: AdvanceListItemResponse) => void;
  onVoid: (advance: AdvanceListItemResponse) => void;
  onSend: (advance: AdvanceListItemResponse) => void;
  children?: React.ReactNode;
}

function AdvanceListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading advances">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AdvanceList({
  advances,
  isLoading = false,
  onDelete,
  onVoid,
  onSend,
  children,
}: AdvanceListProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <AdvanceListSkeleton />
      ) : advances.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No advances found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {advances.map((advance, index) => (
            <AdvanceCard
              key={advance.id}
              advance={advance}
              index={index}
              onDelete={onDelete}
              onVoid={onVoid}
              onSend={onSend}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
