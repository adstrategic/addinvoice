"use client";

import { useState } from "react";
import { useDeleteEstimate } from "./useEstimates";
import type { EstimateResponse } from "@addinvoice/schemas";

interface UseEstimateDeleteOptions {
  onAfterDelete?: () => void;
}

export function useEstimateDelete(options?: UseEstimateDeleteOptions) {
  const deleteMutation = useDeleteEstimate();

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<{
    id: number;
    estimateNumber: string;
    sequence: number;
  } | null>(null);

  const openDeleteModal = (estimate: EstimateResponse) => {
    setEstimateToDelete({
      id: estimate.id,
      estimateNumber: estimate.estimateNumber,
      sequence: estimate.sequence,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEstimateToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!estimateToDelete) return;

    deleteMutation.mutate(
      {
        id: estimateToDelete.id,
        sequence: estimateToDelete.sequence,
      },
      {
        onSuccess: () => {
          closeDeleteModal();
          options?.onAfterDelete?.();
        },
      },
    );
  };

  return {
    isDeleteModalOpen,
    estimateToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  };
}
