"use client";

import { useState } from "react";
import { useDeleteProposal } from "./useProposals";
import type { ProposalResponse } from "@addinvoice/schemas";

interface UseProposalDeleteOptions {
  onAfterDelete?: () => void;
}

export function useProposalDelete(options?: UseProposalDeleteOptions) {
  const deleteMutation = useDeleteProposal();

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<{
    id: number;
    proposalNumber: string;
    sequence: number;
  } | null>(null);

  const openDeleteModal = (proposal: ProposalResponse) => {
    setProposalToDelete({
      id: proposal.id,
      proposalNumber: proposal.proposalNumber,
      sequence: proposal.sequence,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProposalToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!proposalToDelete) return;

    deleteMutation.mutate(
      {
        id: proposalToDelete.id,
        sequence: proposalToDelete.sequence,
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
    proposalToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  };
}
