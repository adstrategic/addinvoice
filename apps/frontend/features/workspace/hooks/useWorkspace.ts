import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "../service/workspace.service";
import type {
  UpsertPaymentMethodDto,
  PaymentMethodType,
} from "../schema/workspace.schema";
import { toast } from "sonner";

export const workspaceKeys = {
  all: ["workspace"] as const,
  paymentMethods: () => [...workspaceKeys.all, "paymentMethods"] as const,
};

/**
 * Hook to fetch workspace payment methods (array)
 */
export function useWorkspacePaymentMethods() {
  return useQuery({
    queryKey: workspaceKeys.paymentMethods(),
    queryFn: () => workspaceService.listPaymentMethods(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to upsert a workspace payment method by type
 */
export function useUpsertPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      dto,
    }: {
      type: PaymentMethodType;
      dto: UpsertPaymentMethodDto;
    }) => workspaceService.upsertPaymentMethod(type, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.paymentMethods(),
      });
      toast.success("Payment settings saved", {
        description: "Your payment preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to save payment settings", {
        description: error.message || "Failed to save payment settings",
      });
    },
  });
}
