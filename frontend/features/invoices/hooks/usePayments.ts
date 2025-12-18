import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  PaymentCreateInput,
  PaymentUpdateInput,
} from "../schemas/invoice.schema";

/**
 * Hook to create a payment
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: PaymentCreateInput;
    }) => invoicesService.createPayment(invoiceId, data),
    onSuccess: () => {
      // Invalidate all invoice details since we key by sequence, not id
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Payment added",
        description: "The payment has been added successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to update a payment
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      paymentId,
      data,
    }: {
      paymentId: number;
      data: PaymentUpdateInput;
    }) => invoicesService.updatePayment(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Payment updated",
        description: "The payment has been updated successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to delete a payment
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentId: number) => invoicesService.deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast({
        title: "Payment deleted",
        description: "The payment has been removed.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment",
        variant: "destructive",
      });
    },
  });
}
