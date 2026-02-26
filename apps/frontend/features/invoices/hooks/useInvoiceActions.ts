import type { UseFormSetError } from "react-hook-form";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "./useInvoices";
import type {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
} from "../schemas/invoice.schema";
import type { InvoiceResponse } from "../schemas/invoice.schema";

/** Result of create invoice mutation (has id, sequence for navigation). */
type CreateInvoiceResult = InvoiceResponse & { items?: unknown[] };

/** Callbacks for create/update; onSuccess for create receives the new invoice. */
export interface InvoiceMutationCallbacks {
  onSuccess?: (result?: CreateInvoiceResult) => void;
}

/** Callbacks for delete; onSuccess has no result. */
export interface InvoiceDeleteCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over invoice mutations: pass setError when used with a form so
 * validation/field errors are set on the form. Uses mutate (not mutateAsync).
 * Success toasts and invalidation in useInvoices; errors in onError (handleMutationError).
 */
export function useInvoiceActions(
  setError?: UseFormSetError<CreateInvoiceDTO>,
) {
  const createMutation = useCreateInvoice(setError);
  const updateMutation = useUpdateInvoice(setError);
  const deleteMutation = useDeleteInvoice();

  const handleCreate = (
    data: CreateInvoiceDTO,
    callbacks?: InvoiceMutationCallbacks,
  ) => {
    createMutation.mutate(data, { onSuccess: callbacks?.onSuccess });
  };

  const handleUpdate = (
    id: number,
    data: UpdateInvoiceDTO,
    callbacks?: InvoiceMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: InvoiceDeleteCallbacks,
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
