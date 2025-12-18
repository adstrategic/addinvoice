"use client";

import { useState } from "react";
import { useClientActions } from "./useClientActions";
import { ClientResponse } from "../types/api";

interface UseClientDeleteOptions {
  onAfterDelete?: () => void;
}

export function useClientDelete(options?: UseClientDeleteOptions) {
  const actions = useClientActions();

  // Estado para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState<{
    id: number;
    sequence: number;
    descripcion: string;
  } | null>(null);

  const openDeleteModal = (client: ClientResponse) => {
    setClienteAEliminar({
      id: client.id,
      sequence: client.sequence,
      descripcion: client.businessName,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setClienteAEliminar(null);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteAEliminar) return;
    try {
      await actions.handleDelete(
        clienteAEliminar.id,
        clienteAEliminar.sequence
      );
      closeDeleteModal();
      options?.onAfterDelete?.();
    } catch (error) {
      // El error ya es manejado por el toast en actions
      console.error(error);
    }
  };

  return {
    isDeleteModalOpen,
    clienteAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
