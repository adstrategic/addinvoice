"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimateCard } from "./EstimateCard";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import { cn } from "@/lib/utils";

interface EstimateListProps {
  estimates: EstimateDashboardResponse[];
  isLoading?: boolean;
  onDownload: (estimate: EstimateDashboardResponse) => void;
  onSend: (estimate: EstimateDashboardResponse) => void;
  onDelete: (estimate: EstimateDashboardResponse) => void;
  onVoid: (estimate: EstimateDashboardResponse) => void;
  onAccept?: (estimate: EstimateDashboardResponse) => void;
  onConvertToInvoice?: (estimate: EstimateDashboardResponse) => void;
  onConvertToProposal?: (estimate: EstimateDashboardResponse) => void;
  children?: React.ReactNode;
}

function EstimateListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading estimates">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EstimateList({
  estimates,
  isLoading = false,
  onDownload,
  onSend,
  onDelete,
  onVoid,
  onAccept,
  onConvertToInvoice,
  onConvertToProposal,
  children,
}: EstimateListProps) {
  return (
    <div
      data-tour-id="estimates-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <EstimateListSkeleton />
      ) : estimates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No estimates found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estimates.map((estimate, index) => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              index={index}
              onDownload={onDownload}
              onSend={onSend}
              onDelete={onDelete}
              onVoid={onVoid}
              onAccept={onAccept}
              onConvertToInvoice={onConvertToInvoice}
              onConvertToProposal={onConvertToProposal}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
