"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { VoiceClientPromptDialog } from "./VoiceClientPromptDialog";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { VoiceCreateFab } from "@/components/shared/VoiceCreateFab";
import { useLimitGuard } from "@/hooks/use-limit-guard";

/**
 * Clients page component
 * Displays client list with server-side search, pagination, stats, and management actions
 */
export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const clientManager = useClientManager();
  const { guardCreate } = useLimitGuard();
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);

  const openVoicePrompt = useCallback(() => {
    if (guardCreate("clients", { viaVoice: true })) return;
    setVoicePromptOpen(true);
  }, [guardCreate]);

  const handleOpenCreateClient = () => {
    if (guardCreate("clients")) return;
    clientManager.openCreate();
  };

  const actionParam = searchParams.get("action");
  const didTriggerCreateRef = useRef(false);

  useEffect(() => {
    if (actionParam !== "create") {
      didTriggerCreateRef.current = false;
      return;
    }
    if (didTriggerCreateRef.current) return;
    didTriggerCreateRef.current = true;
    router.replace(pathname);
    handleOpenCreateClient();
  }, [actionParam, handleOpenCreateClient, pathname, router]);

  const {
    data: clientsData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useClients({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const isInitialLoad = isLoading && !clientsData;
  const isListLoading = isFetching && isPlaceholderData;

  const clientDelete = useClientDelete();

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !clientsData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-destructive">
              Error loading clients. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract clients and pagination info
  const clients = clientsData.data;
  const pagination = clientsData.pagination;

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Clients
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your client relationships
            </p>
          </div>
          <ClientActions
            onCreateByVoice={openVoicePrompt}
            onOpenCreateModal={handleOpenCreateClient}
          />
        </div>

        <ClientStats stats={clientsData.stats} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
          <ClientFilters searchTerm={searchTerm} onSearchChange={setSearch} />

          <ClientList
            clients={clients}
            isLoading={isListLoading}
            onViewDetails={(sequence) => router.push(`/clients/${sequence}`)}
            onEdit={clientManager.openEdit}
            onSendEmail={(client) => {
              if (client.email) window.location.href = `mailto:${client.email}`;
            }}
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
        logoDisplayUrl={clientManager.logoDisplayUrl}
        onLogoSelect={clientManager.handleLogoSelect}
        isUploadingLogo={clientManager.isUploadingLogo}
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

      <VoiceClientPromptDialog
        open={voicePromptOpen}
        onOpenChange={setVoicePromptOpen}
      />

      <VoiceCreateFab
        onClick={openVoicePrompt}
        ariaLabel="Create client by voice"
        tourId="clients-voice-btn"
      />
    </>
  );
}
