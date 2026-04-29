import type { UseFormSetError } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdvanceResponse,
  CreateAdvanceDTO,
  SendAdvanceDTO,
  UpdateAdvanceDTO,
} from "@addinvoice/schemas";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";
import {
  type ListAdvancesParams,
  advancesService,
} from "../service/advances.service";

/**
 * Query key factory for estimate queries
 * Follows TanStack Query best practices for key management
 */
export const advanceKeys = {
  all: ["advances"] as const,
  lists: () => [...advanceKeys.all, "list"] as const,
  list: (params?: ListAdvancesParams) =>
    [...advanceKeys.lists(), params] as const,
  details: () => [...advanceKeys.all, "detail"] as const,
  detail: (id: number) => [...advanceKeys.details(), id] as const,
  pdf: (sequence: number) => [...advanceKeys.detail(sequence), "pdf"] as const,
};

/**
 * Hook to fetch all estimates with pagination and search
 */
export function useAdvances(params?: ListAdvancesParams) {
  return useQuery({
    queryKey: advanceKeys.list(params),
    queryFn: () => advancesService.list(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single estimate by sequence
 * Uses placeholderData to prevent loading flashes when data exists in cache
 */
export function useAdvanceById(id: number | null, enabled = true) {
  return useQuery({
    queryKey: advanceKeys.detail(id ?? -1),
    queryFn: () => advancesService.getById(id!),
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single advance by sequence
 * Uses placeholderData to prevent loading flashes when data exists in cache
 */
export function useAdvanceBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: advanceKeys.detail(sequence!),
    queryFn: () => advancesService.getBySequence(sequence!),
    enabled: enabled && sequence !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

export function useAdvancePdfBytes(sequence: number | null, enabled: boolean) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: advanceKeys.pdf(sequence!),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/advances/${sequence}/pdf`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load PDF preview");
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    },
    enabled: enabled && sequence !== null,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useCreateAdvance(setError?: UseFormSetError<CreateAdvanceDTO>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdvanceDTO) => advancesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
      toast.success("Advance created");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an existing estimate.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateAdvance(setError?: UseFormSetError<CreateAdvanceDTO>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAdvanceDTO }) =>
      advancesService.update(id, data),
    onSuccess: (updatedAdvance) => {
      queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: advanceKeys.detail(updatedAdvance.id),
      });
      queryClient.invalidateQueries({
        queryKey: advanceKeys.pdf(updatedAdvance.sequence),
      });
      toast.success("Advance updated", {
        description: "Your advance changes were saved successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useDeleteAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => advancesService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
      toast.success("Advance deleted");
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useSyncAdvanceAttachments(
  setError?: UseFormSetError<AdvanceResponse>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      advanceId: number;
      keptAttachmentIds: number[];
      orderTokens?: string[];
      newFiles: File[];
    }) =>
      advancesService.syncAttachments(params.advanceId, {
        keptAttachmentIds: params.keptAttachmentIds,
        orderTokens: params.orderTokens,
        newFiles: params.newFiles,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: advanceKeys.detail(variables.advanceId),
      });
      toast.success("Attachments updated", {
        description: "Image changes were saved successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useSendAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      advanceId,
      payload,
    }: {
      advanceId: number;
      payload: SendAdvanceDTO;
    }) => advancesService.sendAdvance(advanceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: advanceKeys.detail(variables.advanceId),
      });
      toast.success("Advance is being sent");
    },
    onError: (err) => handleMutationError(err),
  });
}
