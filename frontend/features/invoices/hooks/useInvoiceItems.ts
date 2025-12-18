import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  InvoiceItemCreateInput,
  InvoiceItemUpdateInput,
} from "../schemas/invoice.schema";

/**
 * Hook to create an invoice item
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateInvoiceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: InvoiceItemCreateInput;
    }) => invoicesService.createItem(invoiceId, data),
    onSuccess: () => {
      // Invalidate all invoice details since we key by sequence, not id
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Product added",
        description: "The product has been added to the invoice successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to update an invoice item
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
      data,
    }: {
      invoiceId: number;
      itemId: number;
      data: InvoiceItemUpdateInput;
    }) => invoicesService.updateItem(invoiceId, itemId, data),
    onSuccess: () => {
      // Invalidate all invoice details since we key by sequence, not id
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to delete an invoice item
 */
export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
    }: {
      invoiceId: number;
      itemId: number;
    }) => invoicesService.deleteItem(invoiceId, itemId),
    onSuccess: () => {
      // Invalidate all invoice details since we key by sequence, not id
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Product deleted",
        description: "The product has been removed from the invoice.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });
}
