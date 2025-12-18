"use client";

import { useState } from "react";
import { useDeleteInvoice } from "./useInvoices";
import { InvoiceResponse } from "../types/api";

interface UseInvoiceDeleteOptions {
  onAfterDelete?: () => void;
}

export function useInvoiceDelete(options?: UseInvoiceDeleteOptions) {
  const deleteMutation = useDeleteInvoice();

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{
    id: number;
    invoiceNumber: string;
    sequence: number;
  } | null>(null);

  const openDeleteModal = (invoice: InvoiceResponse) => {
    setInvoiceToDelete({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sequence: invoice.sequence,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setInvoiceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    await deleteMutation.mutateAsync({
      id: invoiceToDelete.id,
      sequence: invoiceToDelete.sequence,
    });
    closeDeleteModal();
    options?.onAfterDelete?.();
  };

  return {
    isDeleteModalOpen,
    invoiceToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  };
}
