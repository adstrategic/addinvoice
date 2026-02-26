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

  const handleDeleteConfirm = () => {
    if (!clientToDelete) return;
    actions.handleDelete(clientToDelete.id, clientToDelete.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
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
