import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type ListInvoicesParams, invoicesService } from "@/features/invoices";
import { CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice.schema";
import { clientKeys } from "@/features/clients";

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
  enabled: boolean
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
    queryFn: () =>
      invoicesService.getNextInvoiceNumber(businessId!),
    enabled: enabled && businessId != null,
    staleTime: 0, // Always fetch fresh data when enabled
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook to create a new invoice
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
    // This allows the form to show field-specific errors
  });
}

/**
 * Hook to update an existing invoice
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      invoicesService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.sequence),
      });
      // Invalidate all next-number caches (we don't have businessId on delete)
      queryClient.invalidateQueries({
        queryKey: [...invoiceKeys.all, "next-number"],
      });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });
}

