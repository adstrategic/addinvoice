"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProposalCard } from "./ProposalCard";
import { ProposalEmptyState } from "./ProposalFlowHint";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";
import { cn } from "@/lib/utils";

interface ProposalListProps {
  proposals: ProposalDashboardResponse[];
  isLoading?: boolean;
  onDownload: (proposal: ProposalDashboardResponse) => void;
  onSend: (proposal: ProposalDashboardResponse) => void;
  onVoid: (proposal: ProposalDashboardResponse) => void;
  onAccept?: (proposal: ProposalDashboardResponse) => void;
  onConvertToInvoice?: (proposal: ProposalDashboardResponse) => void;
  children?: React.ReactNode;
}

function ProposalListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading proposals">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ProposalList({
  proposals,
  isLoading = false,
  onDownload,
  onSend,
  onVoid,
  onAccept,
  onConvertToInvoice,
  children,
}: ProposalListProps) {
  return (
    <div
      data-tour-id="proposals-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <ProposalListSkeleton />
      ) : proposals.length === 0 ? (
        <ProposalEmptyState />
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal, index) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              index={index}
              onDownload={onDownload}
              onSend={onSend}
              onVoid={onVoid}
              onAccept={onAccept}
              onConvertToInvoice={onConvertToInvoice}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
