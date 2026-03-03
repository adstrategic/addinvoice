"use client";

import { useState } from "react";
import { useDeleteBusiness } from "./useBusinesses";
import type { BusinessResponse } from "../schema/businesses.schema";

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

  const handleDeleteConfirm = () => {
    if (!businessToDelete) return;
    const onSuccess = () => {
      closeDeleteModal();
      options?.onAfterDelete?.();
    };
    deleteMutation.mutate(businessToDelete.id, { onSuccess });
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
