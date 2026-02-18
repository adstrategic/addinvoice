import { useQuery } from "@tanstack/react-query";
import { paymentsService, type ListPaymentsParams } from "../service/payments.service";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: ListPaymentsParams) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
};

/**
 * Fetch payments list with optional filters and pagination
 */
export function usePayments(params?: ListPaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsService.list(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch a single payment by ID for the detail page
 */
export function usePaymentById(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: paymentKeys.detail(id!),
    queryFn: () => paymentsService.getById(id!),
    enabled: enabled && id !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
