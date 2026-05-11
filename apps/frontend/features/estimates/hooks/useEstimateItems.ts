import type { UseFormSetError } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estimatesService } from "../service/estimates.service";
import { estimateKeys } from "./useEstimates";
import type {
  CreateEstimateDescriptiveItemDTO,
  CreateEstimateItemDTO,
  UpdateEstimateDescriptiveItemDTO,
  UpdateEstimateItemDTO,
} from "@addinvoice/schemas";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

/**
 * Hook to create an estimate item.
 * Pass setError when used with a form for field-level errors.
 */
export function useCreateEstimateItem(
  setError?: UseFormSetError<CreateEstimateItemDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      data,
    }: {
      estimateId: number;
      data: CreateEstimateItemDTO;
    }) => estimatesService.createItem(estimateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Product added", {
        description: "The product has been added to the estimate successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an estimate item.
 * Pass setError when used with a form for field-level errors.
 */
export function useUpdateEstimateItem(
  setError?: UseFormSetError<UpdateEstimateItemDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      itemId,
      data,
    }: {
      estimateId: number;
      itemId: number;
      data: UpdateEstimateItemDTO;
    }) => estimatesService.updateItem(estimateId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Product updated", {
        description: "The product has been updated successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to delete an estimate item.
 */
export function useDeleteEstimateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      itemId,
    }: {
      estimateId: number;
      itemId: number;
    }) => estimatesService.deleteItem(estimateId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Product deleted", {
        description: "The product has been removed from the estimate.",
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useCreateEstimateDescriptiveItem(
  setError?: UseFormSetError<CreateEstimateDescriptiveItemDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      data,
    }: {
      estimateId: number;
      data: CreateEstimateDescriptiveItemDTO;
    }) => estimatesService.createDescriptiveItem(estimateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Descriptive item added");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useUpdateEstimateDescriptiveItem(
  setError?: UseFormSetError<UpdateEstimateDescriptiveItemDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      descriptiveItemId,
      data,
    }: {
      estimateId: number;
      descriptiveItemId: number;
      data: UpdateEstimateDescriptiveItemDTO;
    }) =>
      estimatesService.updateDescriptiveItem(
        estimateId,
        descriptiveItemId,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Descriptive item updated");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useDeleteEstimateDescriptiveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimateId,
      descriptiveItemId,
    }: {
      estimateId: number;
      descriptiveItemId: number;
    }) =>
      estimatesService.deleteDescriptiveItem(estimateId, descriptiveItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.details() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      toast.success("Descriptive item deleted");
    },
    onError: (err) => handleMutationError(err),
  });
}
