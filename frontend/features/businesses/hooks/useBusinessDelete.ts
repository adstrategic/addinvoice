"use client";

import { useState } from "react";
import { useDeleteBusiness } from "./useBusinesses";
import { BusinessResponse } from "../types/api";

interface UseBusinessDeleteOptions {
  onAfterDelete?: () => void;
}

export function useBusinessDelete(options?: UseBusinessDeleteOptions) {
  const deleteMutation = useDeleteBusiness();

  // Estado para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const openDeleteModal = (business: BusinessResponse) => {
    setBusinessToDelete({
      id: business.id,
      name: business.name,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBusinessToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete) return;
    try {
      await deleteMutation.mutateAsync(businessToDelete.id);
      closeDeleteModal();
      options?.onAfterDelete?.();
    } catch (error) {
      // El error ya es manejado por el toast en la mutation
      console.error(error);
    }
  };

  return {
    isDeleteModalOpen,
    businessToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  };
}









