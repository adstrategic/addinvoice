"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import LoadingComponent from "@/components/loading-component";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { toast } from "sonner";
import { AdvanceActions } from "./AdvancesActions";
import { AdvanceFilters } from "./AdvancesFilters";
import { AdvanceList } from "./AdvancesList";
import { AdvanceForm } from "../forms/AdvancesForm";
import { statusFilterToApiParam } from "../types/api";
import { useAdvances } from "../hooks/useAdvances";
import { useAdvanceDelete } from "../hooks/useAdvanceDelete";
import { useAdvanceManager } from "../hooks/useAdvancesFormManager";
import { TablePagination } from "@/components/TablePagination";
import { SendAdvanceDialog } from "@/components/send-advance-dialog";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";
import { useSendAdvance } from "../hooks/useAdvances";
import { useLimitGuard } from "@/hooks/use-limit-guard";

export default function AdvancesContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: advancesData,
    isLoading,
    error,
  } = useAdvances({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const advanceManager = useAdvanceManager();
  const deleteAdvance = useAdvanceDelete();
  const sendAdvance = useSendAdvance();
  const { guardCreate } = useLimitGuard();

  const handleCreateAdvance = () => {
    if (guardCreate("advances")) return;
    advanceManager.handleCreateAdvance();
  };
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedAdvanceForSend, setSelectedAdvanceForSend] =
    useState<AdvanceListItemResponse | null>(null);

  const pagination = advancesData?.pagination;
  const advances = advancesData?.data ?? [];

  if (isLoading) return <LoadingComponent variant="dashboard" />;

  if (error || !advancesData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading advances.</p>
        </CardContent>
      </Card>
    );
  }

  if (advanceManager.isFormOpen && advanceManager.selectedBusiness) {
    return (
      <AdvanceForm
        form={advanceManager.form}
        mode={advanceManager.mode}
        images={advanceManager.images}
        isLoading={advanceManager.isMutating}
        isLoadingAdvance={advanceManager.isLoadingAdvance}
        selectedBusiness={advanceManager.selectedBusiness}
        onAddImages={advanceManager.addImages}
        onRemoveImage={advanceManager.removeImage}
        onSubmit={advanceManager.onSubmit}
        onCancel={advanceManager.close}
      />
    );
  }

  return (
    <>
      <div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Work Advances
            </h1>
            <p className="text-muted-foreground">
              Track project progress reports
            </p>
          </div>
          <AdvanceActions
            onCreateAdvance={handleCreateAdvance}
            onCreateByVoice={() => toast.info("Voice creation is coming soon")}
          />
        </div>

        <AdvanceFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <AdvanceList
          advances={advances}
          statusFilter={statusFilter}
          onDelete={deleteAdvance.openDeleteModal}
          onSend={(advance) => {
            setSelectedAdvanceForSend(advance);
            setSendDialogOpen(true);
          }}
        >
          {pagination && (
            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
              emptyMessage="No advances found"
              itemLabel="advances"
            />
          )}
        </AdvanceList>

        <EntityDeleteModal
          isOpen={deleteAdvance.isDeleteModalOpen}
          onClose={deleteAdvance.closeDeleteModal}
          onConfirm={deleteAdvance.handleDeleteConfirm}
          entity="advance"
          entityName={deleteAdvance.advanceToDelete?.label || ""}
          isDeleting={deleteAdvance.isDeleting}
        />

        {selectedAdvanceForSend && (
          <SendAdvanceDialog
            open={sendDialogOpen}
            onOpenChange={(open) => {
              setSendDialogOpen(open);
              if (!open) {
                setSelectedAdvanceForSend(null);
              }
            }}
            advanceId={selectedAdvanceForSend.id}
            clientName={selectedAdvanceForSend.client?.name ?? "Client"}
            clientEmail={selectedAdvanceForSend.client?.email}
            projectName={selectedAdvanceForSend.projectName}
            sending={sendAdvance.isPending}
            onSend={async ({ advanceId, payload }) => {
              await sendAdvance.mutateAsync({ advanceId, payload });
            }}
          />
        )}
      </div>
    </>
  );
}
