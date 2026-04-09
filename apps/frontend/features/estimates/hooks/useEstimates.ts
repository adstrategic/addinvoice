import type { UseFormSetError } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ListEstimatesParams,
  estimatesService,
} from "@/features/estimates";
import type { CreateEstimateDTO, UpdateEstimateDTO } from "@addinvoice/schemas";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

/**
 * Query key factory for estimate queries
 * Follows TanStack Query best practices for key management
 */
export const estimateKeys = {
  all: ["estimates"] as const,
  lists: () => [...estimateKeys.all, "list"] as const,
  list: (params?: ListEstimatesParams) =>
    [...estimateKeys.lists(), params] as const,
  details: () => [...estimateKeys.all, "detail"] as const,
  detail: (id: number) => [...estimateKeys.details(), id] as const,
  nextNumber: (businessId: number | null) =>
    [...estimateKeys.all, "next-number", businessId] as const,
  pdf: (sequence: number) => [...estimateKeys.detail(sequence), "pdf"] as const,
};

/**
 * Hook to fetch all estimates with pagination and search
 */
export function useEstimates(params?: ListEstimatesParams) {
  return useQuery({
    queryKey: estimateKeys.list(params),
    queryFn: () => estimatesService.list(params),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
  });
}

/**
 * Hook to fetch a single estimate by sequence
 * Uses placeholderData to prevent loading flashes when data exists in cache
 */
export function useEstimateBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: estimateKeys.detail(sequence!),
    queryFn: () => estimatesService.getBySequence(sequence!),
    enabled: enabled && sequence !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Raw PDF bytes for inline preview (pdf.js). Authenticated fetch with deduplication via TanStack Query.
 */
export function useEstimatePdfBytes(
  sequence: number | null,
  enabled: boolean,
) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: estimateKeys.pdf(sequence!),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/${sequence}/pdf`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load PDF preview");
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
    enabled: enabled && sequence !== null,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to get the next suggested estimate number for the given business
 */
export function useNextEstimateNumber(
  enabled: boolean,
  businessId: number | null,
) {
  return useQuery({
    queryKey: estimateKeys.nextNumber(businessId),
    queryFn: () => estimatesService.getNextEstimateNumber(businessId!),
    enabled: enabled && businessId != null,
    staleTime: 0, // Always fetch fresh data when enabled
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook to create a new estimate.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useCreateEstimate(
  setError?: UseFormSetError<CreateEstimateDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEstimateDTO) => estimatesService.create(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.nextNumber(variables.businessId),
      });
      toast.success("Estimate created", {
        description: "The estimate has been created successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an existing estimate.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateEstimate(
  setError?: UseFormSetError<CreateEstimateDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstimateDTO }) =>
      estimatesService.update(id, data),
    onSuccess: (updatedEstimate) => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(updatedEstimate.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.pdf(updatedEstimate.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.nextNumber(updatedEstimate.business.id),
      });
      toast.success("Estimate updated", {
        description: "The estimate has been updated successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to mark an estimate as accepted.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useMarkEstimateAsAccepted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (estimateId: number) =>
      estimatesService.markAsAccepted(estimateId),
    onSuccess: (updatedEstimate) => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(updatedEstimate.sequence),
      });
      toast.success("Estimate accepted", {
        description: "The estimate has been marked as accepted.",
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

/**
 * Hook to delete an estimate.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useDeleteEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      estimatesService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(variables.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: [...estimateKeys.all, "next-number"],
      });
      toast.success("Estimate deleted", {
        description: "The estimate has been deleted successfully.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}

/**
 * Hook to convert an accepted estimate to an invoice.
 * On success invalidates estimates and invoices lists and returns the created invoice (sequence for redirect).
 */
export function useConvertEstimateToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sequence,
      selectedPaymentMethodId,
    }: {
      sequence: number;
      selectedPaymentMethodId: number | null;
    }) =>
      estimatesService.convertToInvoice(sequence, {
        selectedPaymentMethodId,
      }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Estimate converted to invoice", {
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });
    },
    onError: (err) => handleMutationError(err),
  });
}
