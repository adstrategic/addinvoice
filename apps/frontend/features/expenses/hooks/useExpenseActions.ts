import type { UseFormSetError } from "react-hook-form";
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "./useExpenses";
import type { CreateExpenseDTO, UpdateExpenseDTO } from "@addinvoice/schemas";

export interface ExpenseMutationCallbacks {
  onSuccess?: () => void;
}

export function useExpenseActions(
  setError?: UseFormSetError<CreateExpenseDTO>,
) {
  const createMutation = useCreateExpense(setError);
  const updateMutation = useUpdateExpense(setError);
  const deleteMutation = useDeleteExpense();

  const handleCreate = (
    data: CreateExpenseDTO,
    callbacks?: ExpenseMutationCallbacks,
  ) => {
    createMutation.mutate({ data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleCreateAsync = (data: CreateExpenseDTO) => {
    return createMutation.mutateAsync({ data });
  };

  const handleUpdate = (
    id: number,
    sequence: number,
    data: UpdateExpenseDTO,
    callbacks?: ExpenseMutationCallbacks,
  ) => {
    updateMutation.mutate(
      { id, data, sequence },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleUpdateAsync = (
    id: number,
    sequence: number,
    data: UpdateExpenseDTO,
  ) => {
    return updateMutation.mutateAsync({ id, data, sequence });
  };

  const handleDelete = (id: number, callbacks?: ExpenseMutationCallbacks) => {
    deleteMutation.mutate({ id }, { onSuccess: callbacks?.onSuccess });
  };

  return {
    handleCreate,
    handleCreateAsync,
    handleUpdate,
    handleUpdateAsync,
    handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || updateMutation.isPending,
  };
}
