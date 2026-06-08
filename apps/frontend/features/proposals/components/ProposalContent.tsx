"use client";

import { useState } from "react";
import {
  ProposalFilters,
  ProposalList,
  ProposalStats,
  useProposals,
  useProposalVoid,
  useMarkProposalAsAccepted,
  useProposalActions,
} from "@/features/proposals";
import { ProposalFlowHint } from "./ProposalFlowHint";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { SendProposalDialog } from "@/components/send-proposal-dialog";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";
import { statusFilterToApiParam } from "../types/api";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useDownloadProposalPdf } from "../hooks/useDownloadProposalPDF";

const VALID_STATUSES = [
  "all",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "invoiced",
] as const;

function parseStatusParam(value: string | null): string {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])
    ? value
    : "all";
}

export default function ProposalsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const statusFilter = parseStatusParam(searchParams.get("status"));
  const setStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedProposalForSend, setSelectedProposalForSend] = useState<
    ProposalDashboardResponse | undefined
  >(undefined);

  const {
    data: proposalsData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useProposals({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const isInitialLoad = isLoading && !proposalsData;
  const isListLoading = isFetching && isPlaceholderData;

  const downloadPdf = useDownloadProposalPdf();
  const proposalVoid = useProposalVoid();
  const markAsAccepted = useMarkProposalAsAccepted();
  const proposalActions = useProposalActions();

  const handleAccept = (proposal: ProposalDashboardResponse) => {
    markAsAccepted.mutate(proposal.id);
  };

  const handleDownloadPDF = async (proposal: ProposalDashboardResponse) => {
    try {
      await downloadPdf(proposal);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleSendProposal = (proposal: ProposalDashboardResponse) => {
    setSelectedProposalForSend(proposal);
    setSendDialogOpen(true);
  };

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !proposalsData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading proposals.</p>
        </CardContent>
      </Card>
    );
  }

  const proposals = proposalsData.data;
  const pagination = proposalsData.pagination;

  return (
    <>
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Proposals
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track proposals you send to your clients
            </p>
          </div>
          <ProposalFlowHint className="w-full max-w-2xl sm:text-left" />
        </div>

        <ProposalStats stats={proposalsData.stats} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
          <ProposalFilters
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          <ProposalList
            proposals={proposals}
            isLoading={isListLoading}
            onDownload={handleDownloadPDF}
            onSend={handleSendProposal}
            onVoid={proposalVoid.openVoidModal}
            onAccept={handleAccept}
            onConvertToInvoice={proposalActions.handleConvertToInvoice}
          >
            {pagination && (
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
                emptyMessage="No proposals found"
                itemLabel="proposals"
              />
            )}
          </ProposalList>
        </div>
      </div>

      <EntityVoidModal
        isOpen={proposalVoid.isVoidModalOpen}
        onClose={proposalVoid.closeVoidModal}
        onConfirm={proposalVoid.handleVoidConfirm}
        entity="proposal"
        entityName={proposalVoid.proposalToVoid?.proposalNumber || ""}
        isVoiding={proposalVoid.isVoiding}
      />

      {selectedProposalForSend && (
        <SendProposalDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            if (!open) {
              setSelectedProposalForSend(undefined);
            }
          }}
          proposalSequence={selectedProposalForSend?.sequence}
          proposalNumber={selectedProposalForSend?.proposalNumber}
          clientName={selectedProposalForSend?.client?.name || "Client"}
          clientEmail={selectedProposalForSend?.clientEmail}
          publicSlug={selectedProposalForSend?.publicSlug}
          enableEmailTab={selectedProposalForSend?.status === "REJECTED"}
        />
      )}
    </>
  );
}
