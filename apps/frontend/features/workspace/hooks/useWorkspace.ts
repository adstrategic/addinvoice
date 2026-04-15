import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "../service/workspace.service";
import type {
  AgentLanguage,
  UpsertPaymentMethodDto,
  PaymentMethodType,
  SetDefaultPaymentMethodDto,
  UpsertWorkspaceLanguageDto,
} from "../schema/workspace.schema";
import { toast } from "sonner";

export const workspaceKeys = {
  all: ["workspace"] as const,
  paymentMethods: () => [...workspaceKeys.all, "paymentMethods"] as const,
  language: () => [...workspaceKeys.all, "language"] as const,
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

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SetDefaultPaymentMethodDto) =>
      workspaceService.setDefaultPaymentMethod(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.paymentMethods(),
      });
      toast.success("Default payment method updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update default method", {
        description: error.message || "Failed to update default method",
      });
    },
  });
}

/**
 * Hook to fetch the workspace language
 */
export function useWorkspaceLanguage() {
  return useQuery({
    queryKey: workspaceKeys.language(),
    queryFn: () => workspaceService.getWorkspaceLanguage(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to update the workspace language
 */
export function useUpsertWorkspaceLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ language }: { language: AgentLanguage }) =>
      workspaceService.updateWorkspaceLanguage({
        language,
      } satisfies UpsertWorkspaceLanguageDto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.language(),
      });
      toast.success("Language updated", {
        description: "Your voice agent language preference has been saved.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to save language", {
        description: error.message || "Failed to save language",
      });
    },
  });
}
