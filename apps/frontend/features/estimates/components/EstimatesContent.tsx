"use client";

import { useState } from "react";
import {
  EstimateStats,
  EstimateFilters,
  EstimateList,
  EstimateActions,
  useEstimates,
  useEstimateDelete,
  useMarkEstimateAsAccepted,
  useEstimateActions,
} from "@/features/estimates";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { motion } from "framer-motion";
import { SendEstimateDialog } from "@/components/send-estimate-dialog";
import { BusinessSelectionDialog } from "@/components/business-selection-dialog";
import { EstimateForm } from "../forms/EstimateForm";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import { statusFilterToApiParam } from "../types/api";
import { useEstimateManager } from "../hooks/useEstimateFormManager";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useDownloadEstimatePdf } from "../hooks/useDownloadEstimatePDF";

const VALID_STATUSES = ["all", "paid", "overdue", "issued", "draft"] as const;

function parseStatusParam(value: string | null): string {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])
    ? value
    : "all";
}

/**
 * Estimates page component
 * Displays estimate list with server-side search, pagination, stats, and management actions
 */
export default function EstimatesContent() {
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
  const [selectedEstimateForSend, setSelectedEstimateForSend] = useState<
    EstimateDashboardResponse | undefined
  >(undefined);
  // Fetch estimates with pagination, search, and status (server-side)
  const {
    data: estimatesData,
    isLoading,
    error,
  } = useEstimates({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const downloadPdf = useDownloadEstimatePdf();

  const estimateManager = useEstimateManager();
  const estimateDelete = useEstimateDelete();
  const markAsAccepted = useMarkEstimateAsAccepted();
  const estimateActions = useEstimateActions();

  const handleAccept = (estimate: EstimateDashboardResponse) => {
    markAsAccepted.mutate(estimate.id);
  };

  const handleDownloadPDF = async (estimate: EstimateDashboardResponse) => {
    try {
      await downloadPdf(estimate);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleSendEstimate = (estimate: EstimateDashboardResponse) => {
    setSelectedEstimateForSend(estimate);
    setSendDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !estimatesData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading estimates. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract estimates and pagination info (already filtered by server)
  const estimates = estimatesData.data;
  const pagination = estimatesData.pagination;

  // If business is selected, show estimate form instead of list
  if (estimateManager.isFormOpen && estimateManager.selectedBusiness) {
    return (
      <EstimateForm
        selectedBusiness={estimateManager.selectedBusiness}
        form={estimateManager.form}
        mode={estimateManager.mode}
        isLoading={estimateManager.isMutating}
        isLoadingEstimate={estimateManager.isLoadingEstimate}
        isLoadingNumber={estimateManager.isLoadingNextNumber}
        estimateError={estimateManager.estimateError}
        onSubmit={estimateManager.onSubmit}
        onCancel={estimateManager.close}
        existingEstimate={estimateManager.estimate}
        createdClient={estimateManager.createdClient}
        ensureEstimateExists={estimateManager.ensureEstimateExists}
        saveBeforeSend={estimateManager.saveBeforeSend}
        saveBeforeOpenSubform={estimateManager.saveBeforeOpenSubform}
        onConvertToInvoice={estimateManager.onConvertToInvoice}
        isConvertingToInvoice={estimateManager.isConvertingToInvoice}
      />
    );
  }

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Estimates
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track all your estimates
            </p>
          </div>
          <EstimateActions
            onCreateEstimate={estimateManager.handleCreateEstimate}
          />
        </motion.div>

        {/* <EstimateStats stats={estimatesData.stats} /> */}

        <EstimateFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Estimates List */}
        <EstimateList
          estimates={estimates}
          statusFilter={statusFilter}
          onDownload={handleDownloadPDF}
          onSend={handleSendEstimate}
          onDelete={estimateDelete.openDeleteModal}
          onAccept={handleAccept}
          onConvertToInvoice={estimateActions.handleConvertToInvoice}
        >
          {pagination && (
            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
              emptyMessage="No estimates found"
              itemLabel="estimates"
            />
          )}
        </EstimateList>
      </div>

      {/* Delete Confirmation Modal - Separate logic */}
      <EntityDeleteModal
        isOpen={estimateDelete.isDeleteModalOpen}
        onClose={estimateDelete.closeDeleteModal}
        onConfirm={estimateDelete.handleDeleteConfirm}
        entity="estimate"
        entityName={estimateDelete.estimateToDelete?.estimateNumber || ""}
        isDeleting={estimateDelete.isDeleting}
      />

      {selectedEstimateForSend && (
        <SendEstimateDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            if (!open) {
              setSelectedEstimateForSend(undefined);
            }
          }}
          estimateSequence={selectedEstimateForSend?.sequence}
          estimateNumber={selectedEstimateForSend?.estimateNumber}
          clientName={selectedEstimateForSend?.client?.name || "Client"}
          clientEmail={selectedEstimateForSend?.clientEmail}
        />
      )}

      <BusinessSelectionDialog
        open={estimateManager.showBusinessDialog}
        businesses={estimateManager.businesses}
        onSelect={estimateManager.selectBusiness}
        onOpenChange={estimateManager.setShowBusinessDialog}
      />
    </>
  );
}
