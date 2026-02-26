import type { UseFormSetError } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  InvoiceItemCreateInput,
  InvoiceItemUpdateInput,
} from "../schemas/invoice.schema";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

/**
 * Hook to create an invoice item.
 * Pass setError when used with a form for field-level errors.
 */
export function useCreateInvoiceItem(
  setError?: UseFormSetError<InvoiceItemCreateInput>,
) {
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
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Product added", {
        description: "The product has been added to the invoice successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an invoice item.
 * Pass setError when used with a form for field-level errors.
 */
export function useUpdateInvoiceItem(
  setError?: UseFormSetError<InvoiceItemUpdateInput>,
) {
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
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Product updated", {
        description: "The product has been updated successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to delete an invoice item.
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
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Product deleted", {
        description: "The product has been removed from the invoice.",
      });
    },
    onError: (err) => handleMutationError(err),
  });
}
