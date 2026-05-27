"use client";

import { useState } from "react";
import { useVoidInvoice } from "./useInvoices";
import type { InvoiceResponse } from "../schemas/invoice.schema";

interface UseInvoiceVoidOptions {
  onAfterVoid?: () => void;
}

export function useInvoiceVoid(options?: UseInvoiceVoidOptions) {
  const voidMutation = useVoidInvoice();

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [invoiceToVoid, setInvoiceToVoid] = useState<{
    id: number;
    invoiceNumber: string;
    sequence: number;
  } | null>(null);

  const openVoidModal = (invoice: InvoiceResponse) => {
    setInvoiceToVoid({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sequence: invoice.sequence,
    });
    setIsVoidModalOpen(true);
  };

  const closeVoidModal = () => {
    setIsVoidModalOpen(false);
    setInvoiceToVoid(null);
  };

  const handleVoidConfirm = () => {
    if (!invoiceToVoid) return;

    voidMutation.mutate(
      {
        id: invoiceToVoid.id,
        sequence: invoiceToVoid.sequence,
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
    invoiceToVoid,
    openVoidModal,
    closeVoidModal,
    handleVoidConfirm,
    isVoiding: voidMutation.isPending,
  };
}
