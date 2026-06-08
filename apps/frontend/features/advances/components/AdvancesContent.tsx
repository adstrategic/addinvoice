"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import LoadingComponent from "@/components/loading-component";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { toast } from "sonner";
import { AdvanceActions } from "./AdvancesActions";
import { AdvanceStats } from "./AdvanceStats";
import { AdvanceFilters } from "./AdvancesFilters";
import { AdvanceList } from "./AdvancesList";
import { AdvanceForm } from "../forms/AdvancesForm";
import { statusFilterToApiParam } from "../types/api";
import { useAdvances } from "../hooks/useAdvances";
import { useAdvanceDelete } from "../hooks/useAdvanceDelete";
import { useAdvanceVoid } from "../hooks/useAdvanceVoid";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { useAdvanceManager } from "../hooks/useAdvancesFormManager";
import { TablePagination } from "@/components/TablePagination";
import { SendAdvanceDialog } from "@/components/send-advance-dialog";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";
import { useSendAdvance } from "../hooks/useAdvances";
import { useLimitGuard } from "@/hooks/use-limit-guard";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const VALID_STATUSES = [
  "all",
  "draft",
  "issued",
  "viewed",
  "invoiced",
] as const;

function parseStatusParam(value: string | null): string {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])
    ? value
    : "all";
}

export default function AdvancesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

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

  const {
    data: advancesData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useAdvances({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const isInitialLoad = isLoading && !advancesData;
  const isListLoading = isFetching && isPlaceholderData;

  const advanceManager = useAdvanceManager();
  const deleteAdvance = useAdvanceDelete();
  const voidAdvance = useAdvanceVoid();
  const sendAdvance = useSendAdvance();
  const { guardCreate } = useLimitGuard();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        advanceManager.isFormOpen ? "app:form-open" : "app:form-close",
      ),
    );
  }, [advanceManager.isFormOpen]);

  const handleCreateAdvance = useCallback(() => {
    if (guardCreate("advances")) return;
    advanceManager.handleCreateAdvance();
  }, [guardCreate, advanceManager]);

  const actionParam = searchParams.get("action");
  const didTriggerCreateRef = useRef(false);

  useEffect(() => {
    if (actionParam !== "create") {
      didTriggerCreateRef.current = false;
      return;
    }
    if (advanceManager.isLoadingBusinesses) return;
    if (didTriggerCreateRef.current) return;
    didTriggerCreateRef.current = true;
    router.replace(pathname);
    handleCreateAdvance();
  }, [
    actionParam,
    advanceManager.isLoadingBusinesses,
    handleCreateAdvance,
    pathname,
    router,
  ]);

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedAdvanceForSend, setSelectedAdvanceForSend] =
    useState<AdvanceListItemResponse | null>(null);

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !advancesData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading advances.</p>
        </CardContent>
      </Card>
    );
  }

  const pagination = advancesData.pagination;
  const advances = advancesData.data;

  if (advanceManager.isFormOpen && advanceManager.selectedBusiness) {
    return (
      <div>
        <button
          type="button"
          onClick={advanceManager.close}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advances
        </button>
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
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Work Advances
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track project progress reports
            </p>
          </div>
          <AdvanceActions
            onCreateAdvance={handleCreateAdvance}
            onCreateByVoice={() => toast.info("Voice creation is coming soon")}
          />
        </div>

        <AdvanceStats stats={advancesData.stats} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
          <AdvanceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          <AdvanceList
            advances={advances}
            isLoading={isListLoading}
            onDelete={deleteAdvance.openDeleteModal}
            onVoid={voidAdvance.openVoidModal}
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
        </div>

        <EntityDeleteModal
          isOpen={deleteAdvance.isDeleteModalOpen}
          onClose={deleteAdvance.closeDeleteModal}
          onConfirm={deleteAdvance.handleDeleteConfirm}
          entity="advance"
          entityName={deleteAdvance.advanceToDelete?.label || ""}
          isDeleting={deleteAdvance.isDeleting}
        />

        <EntityVoidModal
          isOpen={voidAdvance.isVoidModalOpen}
          onClose={voidAdvance.closeVoidModal}
          onConfirm={voidAdvance.handleVoidConfirm}
          entity="advance"
          entityName={voidAdvance.advanceToVoid?.label || ""}
          isVoiding={voidAdvance.isVoiding}
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
            advanceSequence={selectedAdvanceForSend.sequence}
            clientName={selectedAdvanceForSend.client?.name ?? "Client"}
            clientEmail={selectedAdvanceForSend.client?.email}
            projectName={selectedAdvanceForSend.projectName}
            publicSlug={selectedAdvanceForSend.publicSlug}
            sending={sendAdvance.isPending}
            onSend={async ({ sequence, payload }) => {
              await sendAdvance.mutateAsync({ sequence, payload });
            }}
          />
        )}
      </div>
    </>
  );
}
