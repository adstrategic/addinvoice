import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  InvoiceItemCreateInput,
  InvoiceItemUpdateInput,
} from "../schemas/invoice.schema";
import { toast } from "sonner";

/**
 * Hook to create an invoice item
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateInvoiceItem() {
  const queryClient = useQueryClient();

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
      toast.success("Product added", {
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
      toast.success("Product updated", {
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
      toast.success("Product deleted", {
        description: "The product has been removed from the invoice.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete product", {
        description: error.message || "Failed to delete product",
      });
    },
  });
}
