"use client";

import { useState } from "react";
import { useCatalogActions } from "./useCatalogActions";
import type { CatalogResponse } from "../schema/catalog.schema";

interface UseCatalogDeleteOptions {
  onAfterDelete?: () => void;
}

export function useCatalogDelete(options?: UseCatalogDeleteOptions) {
  const actions = useCatalogActions();

  // Estado para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (catalog: CatalogResponse) => {
    setCatalogToDelete({
      id: catalog.id,
      sequence: catalog.sequence,
      description: catalog.name,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCatalogToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!catalogToDelete) return;
    try {
      await actions.handleDelete(catalogToDelete.id, catalogToDelete.sequence);
      closeDeleteModal();
      options?.onAfterDelete?.();
    } catch (error) {
      // El error ya es manejado por el toast en actions
      console.error(error);
    }
  };

  return {
    isDeleteModalOpen,
    catalogToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}

