"use client";

import { useState } from "react";
import { useDeleteExpense } from "./useExpenses";
import type { ExpenseResponse } from "../schema/expenses.schema";

interface UseExpenseDeleteOptions {
  onAfterDelete?: () => void;
}

export function useExpenseDelete(options?: UseExpenseDeleteOptions) {
  const deleteMutation = useDeleteExpense();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (expense: ExpenseResponse) => {
    setExpenseToDelete({
      id: expense.id,
      sequence: expense.sequence,
      description: `#${expense.sequence}${expense.description ? `: ${expense.description}` : ""}`,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!expenseToDelete) return;
    deleteMutation.mutate(
      { id: expenseToDelete.id },
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
    expenseToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  };
}
