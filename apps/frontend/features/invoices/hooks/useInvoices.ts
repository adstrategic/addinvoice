import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ListInvoicesParams, invoicesService } from "@/features/invoices";
import type {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
} from "../schemas/invoice.schema";
import { clientKeys } from "@/features/clients";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

/**
 * Query key factory for invoice queries
 * Follows TanStack Query best practices for key management
 */
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params?: ListInvoicesParams) =>
    [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  nextNumber: (businessId: number | null) =>
    [...invoiceKeys.all, "next-number", businessId] as const,
};

/**
 * Hook to fetch all invoices with pagination and search
 */
export function useInvoices(params?: ListInvoicesParams) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesService.list(params),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
  });
}

/**
 * Hook to fetch a single invoice by sequence
 * Uses placeholderData to prevent loading flashes when data exists in cache
 */
export function useInvoiceBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: invoiceKeys.detail(sequence!),
    queryFn: () => invoicesService.getBySequence(sequence!),
    enabled: enabled && sequence !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook to get the next suggested invoice number for the given business
 */
export function useNextInvoiceNumber(
  enabled: boolean,
  businessId: number | null,
) {
  return useQuery({
    queryKey: invoiceKeys.nextNumber(businessId),
    queryFn: () => invoicesService.getNextInvoiceNumber(businessId!),
    enabled: enabled && businessId != null,
    staleTime: 0, // Always fetch fresh data when enabled
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook to create a new invoice.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useCreateInvoice(
  setError?: UseFormSetError<CreateInvoiceDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDTO) => invoicesService.create(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.nextNumber(variables.businessId),
      });

      if (variables.createClient) {
        queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      }
      toast.success("Invoice created", {
        description: "The invoice has been created successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an existing invoice.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateInvoice(
  setError?: UseFormSetError<CreateInvoiceDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInvoiceDTO }) =>
      invoicesService.update(id, data),
    onSuccess: (updatedInvoice, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(updatedInvoice.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.nextNumber(updatedInvoice.business.id),
      });
      if (variables.data.createClient) {
        queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      }
      toast.success("Invoice updated", {
        description: "The invoice has been updated successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to delete an invoice.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      invoicesService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: [...invoiceKeys.all, "next-number"],
      });
      toast.success("Invoice deleted", {
        description: "The invoice has been deleted successfully.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}
