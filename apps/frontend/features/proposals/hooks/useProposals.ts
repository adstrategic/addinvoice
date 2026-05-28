import type { UseFormSetError } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ListProposalsParams,
  proposalsService,
} from "@/features/proposals";
import type { UpdateProposalDTO } from "@addinvoice/schemas";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

export const proposalKeys = {
  all: ["proposals"] as const,
  lists: () => [...proposalKeys.all, "list"] as const,
  list: (params?: ListProposalsParams) =>
    [...proposalKeys.lists(), params] as const,
  details: () => [...proposalKeys.all, "detail"] as const,
  detail: (id: number) => [...proposalKeys.details(), id] as const,
  pdf: (sequence: number) => [...proposalKeys.detail(sequence), "pdf"] as const,
};

export function useProposals(params?: ListProposalsParams) {
  return useQuery({
    queryKey: proposalKeys.list(params),
    queryFn: () => proposalsService.list(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useProposalBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: proposalKeys.detail(sequence!),
    queryFn: () => proposalsService.getBySequence(sequence!),
    enabled: enabled && sequence !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useProposalPdfBytes(sequence: number | null, enabled: boolean) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: proposalKeys.pdf(sequence!),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/proposals/${sequence}/pdf`;
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

export function useUpdateProposal(
  setError?: UseFormSetError<UpdateProposalDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProposalDTO }) =>
      proposalsService.update(id, data),
    onSuccess: (updatedProposal) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(updatedProposal.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.pdf(updatedProposal.sequence),
      });
      toast.success("Proposal updated", {
        description: "The proposal has been updated successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useMarkProposalAsAccepted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: number) =>
      proposalsService.markAsAccepted(proposalId),
    onSuccess: (updatedProposal) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(updatedProposal.sequence),
      });
      toast.success("Proposal accepted", {
        description: "The proposal has been marked as accepted.",
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequence }: { sequence: number }) =>
      proposalsService.send(sequence),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(updated.sequence),
      });
      toast.success("Proposal resent successfully");
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      proposalsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(variables.sequence),
      });
      toast.success("Proposal deleted", {
        description: "The proposal has been deleted successfully.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}

export function useVoidProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      proposalsService.void(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(variables.sequence),
      });
      toast.success("Proposal voided", {
        description: "The proposal has been marked as voided.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}

export function useConvertProposalToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequence }: { sequence: number }) =>
      proposalsService.convertToInvoice(sequence),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Proposal converted to invoice", {
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });
    },
    onError: (err) => handleMutationError(err),
  });
}
