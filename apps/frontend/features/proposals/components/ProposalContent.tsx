"use client";

import { useState } from "react";
import {
  ProposalFilters,
  ProposalList,
  useProposals,
  useProposalVoid,
  useMarkProposalAsAccepted,
  useProposalActions,
} from "@/features/proposals";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { motion } from "framer-motion";
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

/**
 * Proposals page component
 * Displays proposal list with server-side search, pagination, stats, and management actions
 */
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
    router.push(`${pathname}?${params.toString()}`);
  };

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedProposalForSend, setSelectedProposalForSend] = useState<
    ProposalDashboardResponse | undefined
  >(undefined);
  // Fetch proposals with pagination, search, and status (server-side)
  const {
    data: proposalsData,
    isLoading,
    error,
  } = useProposals({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

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

  if (isLoading) return <LoadingComponent variant="dashboard" />;

  if (error || !proposalsData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-destructive">
              Error loading proposals. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract proposals and pagination info (already filtered by server)
  const proposals = proposalsData.data;
  const pagination = proposalsData.pagination;

  return (
    <>
      <div>
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Proposals
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track all your proposals
            </p>
          </div>
        </motion.div>

        {/* <ProposalStats stats={proposalsData.stats} /> */}

        <ProposalFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Proposals List */}
        <ProposalList
          proposals={proposals}
          statusFilter={statusFilter}
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

      {/* Delete Confirmation Modal - Separate logic */}
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
