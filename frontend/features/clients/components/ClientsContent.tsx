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
    isFetching,
    error,
  } = useClients({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const clientDelete = useClientDelete();

  // Extract clients and pagination info
  const clients = clientsData?.data || [];
  const pagination = clientsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Calculate client stats from invoices (temporary until backend provides this)
  // TODO: add stats after invoice feature
  // const clientsWithStats = useMemo(() => {
  //   if (typeof window === "undefined" || !clients.length) return [];

  //   // Load invoices to calculate stats
  //   const emittedInvoices = JSON.parse(
  //     localStorage.getItem("emittedInvoices") || "[]"
  //   );
  //   const draftInvoices = JSON.parse(
  //     localStorage.getItem("invoiceDrafts") || "[]"
  //   );
  //   const allInvoices = [...emittedInvoices, ...draftInvoices];

  //   return calculateClientStats(clients, allInvoices);
  // }, [clients]);

  // const handleViewDetails = (clientId: number) => {
  //   toast({
  //     title: "View client details",
  //     description: `Opening details for client ${clientId}...`,
  //   });
  //   // TODO: Navigate to client detail page when implemented
  //   console.log(`Viewing client ${clientId}`);
  // };

  // const handleEdit = (client: ClientResponse) => {
  //   setSelectedClient(client);
  //   setEditDialogOpen(true);
  // };

  // const handleViewInvoices = (client: ClientResponse) => {
  //   toast({
  //     title: "View invoices",
  //     description: `Showing invoices for ${client.name}...`,
  //   });
  //   router.push(`/invoices?client=${client.id}`);
  // };

  // const handleSendEmail = (client: ClientResponse) => {
  //   if (!client.email) return;
  //   toast({
  //     title: "Send email",
  //     description: `Opening email to ${client.email}...`,
  //   });
  //   window.location.href = `mailto:${client.email}`;
  // };

  // const handleDelete = async (client: ClientResponse) => {
  //   if (
  //     !confirm(
  //       `Are you sure you want to delete ${client.name}? This action cannot be undone.`
  //     )
  //   ) {
  //     return;
  //   }

  //   try {
  //     await deleteClientMutation.mutateAsync(client.id);
  //   } catch (error) {
  //     // Error handling is done in the mutation hook
  //   }
  // };

  // const handleClientAdded = () => {
  //   // Client list will automatically refetch due to query invalidation
  // };

  // const handleClientUpdated = () => {
  //   // Client list will automatically refetch due to query invalidation
  //   setEditDialogOpen(false);
  //   setSelectedClient(null);
  // };

  if (error) {
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

  if (isFetching) {
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

        <>
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
        </>
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
    </>
  );
}
