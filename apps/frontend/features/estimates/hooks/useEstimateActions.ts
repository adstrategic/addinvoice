import type { UseFormSetError } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  useCreateEstimate,
  useUpdateEstimate,
  useDeleteEstimate,
  useConvertEstimateToInvoice,
} from "./useEstimates";
import type { CreateEstimateDTO, UpdateEstimateDTO } from "@addinvoice/schemas";
import type { EstimateResponse } from "@addinvoice/schemas";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";

/** Result of create estimate mutation (has id, sequence for navigation). */
type CreateEstimateResult = EstimateResponse;

/** Callbacks for create/update; onSuccess for create receives the new estimate. */
export interface EstimateMutationCallbacks {
  onSuccess?: (result?: CreateEstimateResult) => void;
}

/** Callbacks for delete; onSuccess has no result. */
export interface EstimateDeleteCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over estimate mutations: pass setError when used with a form so
 * validation/field errors are set on the form. Uses mutate (not mutateAsync).
 * Success toasts and invalidation in useEstimates; errors in onError (handleMutationError).
 */
export function useEstimateActions(
  setError?: UseFormSetError<CreateEstimateDTO>,
) {
  const router = useRouter();
  const createMutation = useCreateEstimate(setError);
  const updateMutation = useUpdateEstimate(setError);
  const deleteMutation = useDeleteEstimate();
  const convertToInvoiceMutation = useConvertEstimateToInvoice();

  const handleCreate = (
    data: CreateEstimateDTO,
    callbacks?: EstimateMutationCallbacks,
  ) => {
    createMutation.mutate(data, { onSuccess: callbacks?.onSuccess });
  };

  const handleUpdate = (
    id: number,
    data: UpdateEstimateDTO,
    callbacks?: EstimateMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: EstimateDeleteCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleConvertToInvoice = (estimate: {
    sequence: number;
    selectedPaymentMethodId?: number | null;
  }) => {
    convertToInvoiceMutation.mutate(
      {
        sequence: estimate.sequence,
        selectedPaymentMethodId: estimate.selectedPaymentMethodId ?? null,
      },
      {
      onSuccess: (invoice) => {
        router.push(`/invoices/${invoice.sequence}`);
      },
      },
    );
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleConvertToInvoice,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConvertingToInvoice: convertToInvoiceMutation.isPending,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      convertToInvoiceMutation.isPending,
  };
}
