import type { UseFormSetError } from "react-hook-form";
import {
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "./useClients";
import type { CreateClientDTO, UpdateClientDTO } from "@addinvoice/schemas";

/** Options passed when invoking an action; UI callbacks run only if component is still mounted. */
export interface ClientMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over client mutations: one place to pass setError, consistent handler APIs,
 * and aggregated loading state. Uses mutate (not mutateAsync) so no unhandled rejections.
 * Success toasts and invalidation in useClients (onSuccess); errors in onError (handleMutationError).
 * Pass onSuccess for UI follow-up (e.g. close modal, navigate) so it runs after mutation success.
 */
export function useClientActions(setError?: UseFormSetError<CreateClientDTO>) {
  const createMutation = useCreateClient(setError);
  const updateMutation = useUpdateClient(setError);
  const deleteMutation = useDeleteClient();

  const handleCreate = (
    data: CreateClientDTO,
    callbacks?: ClientMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateClientDTO,
    callbacks?: ClientMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: ClientMutationCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  return {
    // Action handlers
    handleCreate,
    handleUpdate,
    handleDelete,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Combined loading state for forms
    isMutating: createMutation.isPending || updateMutation.isPending,
  };
}
