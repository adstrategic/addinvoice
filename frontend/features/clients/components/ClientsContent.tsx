"use client";

import {
  ClientStats,
  ClientList,
  ClientFilters,
  useClients,
  ClientFormModal,
  useClientManager,
  useClientDelete,
  ClientActions,
} from "@/features/clients";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

/**
 * Clients page component
 * Displays client list with server-side search, pagination, stats, and management actions
 */
export default function ClientsPage() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const clientManager = useClientManager();

  // Fetch clients with pagination and search
  const {
    data: clientsData,
    isLoading,
    error,
  } = useClients({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const clientDelete = useClientDelete();

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

  if (error || !clientsData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading clients. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract clients and pagination info
  const clients = clientsData.data;
  const pagination = clientsData.pagination;

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Clients
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your client relationships
            </p>
          </div>
          <ClientActions onOpenCreateModal={clientManager.openCreate} />
        </div>

        <div className="mb-6 sm:mb-8">
          <ClientStats clients={clients} />
        </div>

        <ClientFilters searchTerm={searchTerm} onSearchChange={setSearch} />
        {/* Clients List */}
        <ClientList
          clients={clients}
          onViewDetails={() => {}}
          onEdit={clientManager.openEdit}
          onViewInvoices={() => {}}
          onSendEmail={() => {}}
          onDelete={clientDelete.openDeleteModal}
        >
          {pagination && (
            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
              emptyMessage="No clients found"
              itemLabel="clients"
            />
          )}
        </ClientList>
      </div>

      {/* Client Form Modal - handles both create and edit */}
      <ClientFormModal
        isOpen={clientManager.isOpen}
        onClose={clientManager.close}
        mode={clientManager.mode}
        initialData={clientManager.client}
        form={clientManager.form}
        onSubmit={clientManager.onSubmit}
        isLoading={clientManager.isMutating}
        isLoadingClient={clientManager.isLoadingClient}
        clientError={clientManager.clientError}
      />

      {/* Client Delete Modal */}
      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clientToDelete?.description || ""}
        isDeleting={clientDelete.isDeleting}
      />
    </>
  );
}
