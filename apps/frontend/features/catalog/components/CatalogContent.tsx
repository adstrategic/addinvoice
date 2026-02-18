"use client";

import { useState, useCallback } from "react";
import {
  CatalogList,
  CatalogFilters,
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
import { Package } from "lucide-react";
import type { CatalogSortBy } from "./CatalogFilters";

/**
 * Catalog page component
 * Displays catalog list with server-side search, pagination, and management actions
 */
export default function CatalogContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<CatalogSortBy>("sequence");
  const sortOrder = "asc" as const;

  const catalogManager = useCatalogFormManager();

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

  // Fetch catalogs with pagination, search, business filter, and sort
  const {
    data: catalogsData,
    isLoading,
    error,
  } = useCatalogs({
    page: currentPage,
    search: debouncedSearch || undefined,
    businessId:
      businessIdFilter === "all" ? undefined : Number(businessIdFilter),
    sortBy,
    sortOrder,
  });

  const catalogDelete = useCatalogDelete();

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !catalogsData) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading catalog items. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract catalogs and pagination info
  const catalogs = catalogsData.data;
  const pagination = catalogsData.pagination;

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8" />
              Catalog
            </h1>
            <p className="text-muted-foreground mt-1">
              Save your products and services and link them to the correct
              company.
            </p>
          </div>
          <CatalogActions onOpenCreateModal={catalogManager.openCreate} />
        </div>

        <CatalogFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          businessId={businessIdFilter}
          onBusinessIdChange={handleBusinessIdChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
        />

        {/* Catalog List */}
        <CatalogList
          catalogs={catalogs}
          onEdit={catalogManager.openEdit}
          onDelete={catalogDelete.openDeleteModal}
          onAddNew={catalogManager.openCreate}
        >
          {pagination && (
            <div className="mt-6">
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
                emptyMessage="No catalog items found"
                itemLabel="items"
              />
            </div>
          )}
        </CatalogList>
      </div>

      {/* Catalog Form Modal - handles both create and edit */}
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

      {/* Catalog Delete Modal */}
      <EntityDeleteModal
        isOpen={catalogDelete.isDeleteModalOpen}
        onClose={catalogDelete.closeDeleteModal}
        onConfirm={catalogDelete.handleDeleteConfirm}
        entity="catalog item"
        entityName={catalogDelete.catalogToDelete?.description || ""}
        isDeleting={catalogDelete.isDeleting}
      />
    </>
  );
}
