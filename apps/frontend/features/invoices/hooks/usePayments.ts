import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  CreatePaymentDto,
  UpdatePaymentDto,
} from "@/features/payments/schemas/payments.schema";
import { toast } from "sonner";

/**
 * Hook to create a payment
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      invoiceSequence,
      data,
    }: {
      invoiceId: number;
      invoiceSequence: number;
      data: CreatePaymentDto;
    }) => invoicesService.createPayment(invoiceId, data),
    onSuccess: (_, { invoiceSequence }) => {
      // Invalidate all invoice details since we key by sequence, not id
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(invoiceSequence),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment added", {
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

  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
      data,
    }: {
      invoiceId: number;
      paymentId: number;
      data: UpdatePaymentDto;
    }) => invoicesService.updatePayment(invoiceId, paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment updated", {
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

  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
    }: {
      invoiceId: number;
      paymentId: number;
    }) => invoicesService.deletePayment(invoiceId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment deleted", {
        description: "The payment has been removed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete payment", {
        description: error.message || "Failed to delete payment",
      });
    },
  });
}
