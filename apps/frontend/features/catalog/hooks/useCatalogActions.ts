import type { UseFormSetError } from "react-hook-form";
import {
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
} from "./useCatalogs";
import type {
  CreateCatalogDto,
  UpdateCatalogDto,
} from "../schema/catalog.schema";

/** Options passed when invoking an action; UI callbacks run only if component is still mounted. */
export interface CatalogMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over catalog mutations: one place to pass setError, consistent handler APIs,
 * and aggregated loading state. Uses mutate (not mutateAsync) so no unhandled rejections.
 * Success toasts and invalidation in useCatalogs (onSuccess); errors in onError (handleMutationError).
 * Pass onSuccess for UI follow-up (e.g. close modal, navigate) so it runs after mutation success.
 */
export function useCatalogActions(
  setError?: UseFormSetError<CreateCatalogDto>,
) {
  const createMutation = useCreateCatalog(setError);
  const updateMutation = useUpdateCatalog(setError);
  const deleteMutation = useDeleteCatalog();

  const handleCreate = (
    data: CreateCatalogDto,
    callbacks?: CatalogMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateCatalogDto,
    callbacks?: CatalogMutationCallbacks,
  ) => {
    updateMutation.mutate(
      { id, data },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: CatalogMutationCallbacks,
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
