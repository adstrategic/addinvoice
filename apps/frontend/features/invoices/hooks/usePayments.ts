import type { UseFormSetError } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "../service/invoices.service";
import { invoiceKeys } from "./useInvoices";
import type {
  CreatePaymentDto,
  UpdatePaymentDto,
} from "@/features/payments/schemas/payments.schema";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

/**
 * Hook to create a payment.
 * Pass setError when used with a form for field-level errors.
 */
export function useCreatePayment(setError?: UseFormSetError<CreatePaymentDto>) {
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
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(invoiceSequence),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment added", {
        description: "The payment has been added successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update a payment.
 * Pass setError when used with a form for field-level errors.
 */
export function useUpdatePayment(setError?: UseFormSetError<UpdatePaymentDto>) {
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
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to delete a payment.
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
    onError: (err) => handleMutationError(err),
  });
}
