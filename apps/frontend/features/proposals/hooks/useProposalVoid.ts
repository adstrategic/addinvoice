"use client";

import { useState } from "react";
import type { ProposalResponse } from "@addinvoice/schemas";
import { useVoidProposal } from "./useProposals";

interface UseProposalVoidOptions {
  onAfterVoid?: () => void;
}

export function useProposalVoid(options?: UseProposalVoidOptions) {
  const voidMutation = useVoidProposal();

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [proposalToVoid, setProposalToVoid] = useState<{
    id: number;
    proposalNumber: string;
    sequence: number;
  } | null>(null);

  const openVoidModal = (proposal: ProposalResponse) => {
    setProposalToVoid({
      id: proposal.id,
      proposalNumber: proposal.proposalNumber,
      sequence: proposal.sequence,
    });
    setIsVoidModalOpen(true);
  };

  const closeVoidModal = () => {
    setIsVoidModalOpen(false);
    setProposalToVoid(null);
  };

  const handleVoidConfirm = () => {
    if (!proposalToVoid) return;

    voidMutation.mutate(
      {
        id: proposalToVoid.id,
        sequence: proposalToVoid.sequence,
      },
      {
        onSuccess: () => {
          closeVoidModal();
          options?.onAfterVoid?.();
        },
      },
    );
  };

  return {
    isVoidModalOpen,
    proposalToVoid,
    openVoidModal,
    closeVoidModal,
    handleVoidConfirm,
    isVoiding: voidMutation.isPending,
  };
}
