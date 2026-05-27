"use client";

import { useState } from "react";
import type { EstimateResponse } from "@addinvoice/schemas";
import { useVoidEstimate } from "./useEstimates";

interface UseEstimateVoidOptions {
  onAfterVoid?: () => void;
}

export function useEstimateVoid(options?: UseEstimateVoidOptions) {
  const voidMutation = useVoidEstimate();

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [estimateToVoid, setEstimateToVoid] = useState<{
    id: number;
    estimateNumber: string;
    sequence: number;
  } | null>(null);

  const openVoidModal = (estimate: EstimateResponse) => {
    setEstimateToVoid({
      id: estimate.id,
      estimateNumber: estimate.estimateNumber,
      sequence: estimate.sequence,
    });
    setIsVoidModalOpen(true);
  };

  const closeVoidModal = () => {
    setIsVoidModalOpen(false);
    setEstimateToVoid(null);
  };

  const handleVoidConfirm = () => {
    if (!estimateToVoid) return;

    voidMutation.mutate(
      {
        id: estimateToVoid.id,
        sequence: estimateToVoid.sequence,
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
    estimateToVoid,
    openVoidModal,
    closeVoidModal,
    handleVoidConfirm,
    isVoiding: voidMutation.isPending,
  };
}
