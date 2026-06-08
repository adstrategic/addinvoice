"use client";

import { useState, useCallback } from "react";
import {
  CatalogList,
  CatalogFilters,
  CatalogStats,
  CatalogActions,
  useCatalogs,
  CatalogFormModal,
  useCatalogFormManager,
  useCatalogDelete,
} from "@/features/catalog";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { BusinessSelectionDialog } from "@/components/business-selection-dialog";
import type { CatalogSortBy } from "./CatalogFilters";
import { VoiceCatalogPromptDialog } from "./VoiceCatalogPromptDialog";
import { VoiceCreateFab } from "@/components/shared/VoiceCreateFab";
import { useLimitGuard } from "@/hooks/use-limit-guard";

export default function CatalogContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<CatalogSortBy>("sequence");
  const sortOrder = "asc" as const;

  const catalogManager = useCatalogFormManager();
  const { guardCreate } = useLimitGuard();

  const handleOpenCreateCatalog = () => {
    if (guardCreate("catalog")) return;
    catalogManager.openCreate();
  };

  const handleCreateCatalogByVoice = useCallback(() => {
    if (guardCreate("catalog", { viaVoice: true })) return;
    catalogManager.handleCreateCatalogByVoice();
  }, [guardCreate, catalogManager]);

  const handleBusinessIdChange = useCallback(
    (value: string) => {
      setBusinessIdFilter(value);
      setPage(1);
    },
    [setPage],
  );

  const handleSortByChange = useCallback(
    (value: CatalogSortBy) => {
      setSortBy(value);
      setPage(1);
    },
    [setPage],
  );

  const {
    data: catalogsData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useCatalogs({
    page: currentPage,
    search: debouncedSearch || undefined,
    businessId:
      businessIdFilter === "all" ? undefined : Number(businessIdFilter),
    sortBy,
    sortOrder,
  });

  const isInitialLoad = isLoading && !catalogsData;
  const isListLoading = isFetching && isPlaceholderData;

  const catalogDelete = useCatalogDelete();

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !catalogsData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading catalog items. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const catalogs = catalogsData.data;
  const pagination = catalogsData.pagination;

  return (
    <>
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Catalog
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Save your products and services and link them to the correct
              company.
            </p>
          </div>
          <CatalogActions
            onOpenCreateModal={handleOpenCreateCatalog}
            onCreateByVoice={handleCreateCatalogByVoice}
          />
        </div>

        <CatalogStats stats={catalogsData.stats} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
          <CatalogFilters
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            businessId={businessIdFilter}
            onBusinessIdChange={handleBusinessIdChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
          />

          <CatalogList
            catalogs={catalogs}
            isLoading={isListLoading}
            onEdit={catalogManager.openEdit}
            onDelete={catalogDelete.openDeleteModal}
            onAddNew={handleOpenCreateCatalog}
          >
            {pagination && (
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
                emptyMessage="No catalog items found"
                itemLabel="items"
              />
            )}
          </CatalogList>
        </div>
      </div>

      <CatalogFormModal
        isOpen={catalogManager.isOpen}
        onClose={catalogManager.close}
        mode={catalogManager.mode}
        initialData={catalogManager.catalog}
        business={catalogManager.business}
        form={catalogManager.form}
        onSubmit={catalogManager.onSubmit}
        isLoading={catalogManager.isMutating}
        isLoadingCatalog={catalogManager.isLoadingCatalog}
        catalogError={catalogManager.catalogError}
      />

      <EntityDeleteModal
        isOpen={catalogDelete.isDeleteModalOpen}
        onClose={catalogDelete.closeDeleteModal}
        onConfirm={catalogDelete.handleDeleteConfirm}
        entity="catalog item"
        entityName={catalogDelete.catalogToDelete?.description || ""}
        isDeleting={catalogDelete.isDeleting}
      />

      <BusinessSelectionDialog
        open={catalogManager.showBusinessDialog}
        businesses={catalogManager.businesses}
        onSelect={catalogManager.selectBusiness}
        onOpenChange={catalogManager.setShowBusinessDialog}
      />

      <VoiceCatalogPromptDialog
        open={catalogManager.voicePromptOpen}
        business={catalogManager.voiceBusiness}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            catalogManager.closeVoicePrompt();
          }
        }}
      />

      <VoiceCreateFab
        onClick={handleCreateCatalogByVoice}
        ariaLabel="Create product by voice"
      />
    </>
  );
}
