import type { UseFormSetError } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  useCreateAdvance,
  useUpdateAdvance,
  useDeleteAdvance,
} from "./useAdvances";
import type { CreateAdvanceDTO, UpdateAdvanceDTO } from "@addinvoice/schemas";
import type { AdvanceResponse } from "@addinvoice/schemas";

/** Result of create advance mutation (has id, sequence for navigation). */
type CreateAdvanceResult = AdvanceResponse;

/** Callbacks for create/update; onSuccess for create receives the new advance. */
export interface AdvanceMutationCallbacks {
  onSuccess?: (result?: CreateAdvanceResult) => void;
}

/** Callbacks for delete; onSuccess has no result. */
export interface AdvanceDeleteCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over advance mutations: pass setError when used with a form so
 * validation/field errors are set on the form. Uses mutate (not mutateAsync).
 * Success toasts and invalidation in useAdvances; errors in onError (handleMutationError).
 */
export function useAdvanceActions(
  setError?: UseFormSetError<CreateAdvanceDTO>,
) {
  const router = useRouter();
  const createMutation = useCreateAdvance(setError);
  const updateMutation = useUpdateAdvance(setError);
  const deleteMutation = useDeleteAdvance();

  const handleCreate = (
    data: CreateAdvanceDTO,
    callbacks?: AdvanceMutationCallbacks,
  ) => {
    createMutation.mutate(data, { onSuccess: callbacks?.onSuccess });
  };

  const handleUpdate = (
    id: number,
    data: UpdateAdvanceDTO,
    callbacks?: AdvanceMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: AdvanceDeleteCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || updateMutation.isPending,
  };
}
