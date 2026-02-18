"use client";

import { useState } from "react";
import { useClientActions } from "./useClientActions";
import type { ClientResponse } from "../schema/clients.schema";

interface UseClientDeleteOptions {
  onAfterDelete?: () => void;
}

export function useClientDelete(options?: UseClientDeleteOptions) {
  const actions = useClientActions();

  // Estado para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (client: ClientResponse) => {
    setClientToDelete({
      id: client.id,
      sequence: client.sequence,
      description: client.businessName || client.name,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await actions.handleDelete(clientToDelete.id, clientToDelete.sequence);
      closeDeleteModal();
      options?.onAfterDelete?.();
    } catch (error) {
      // El error ya es manejado por el toast en actions
      console.error(error);
    }
  };

  return {
    isDeleteModalOpen,
    clientToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
