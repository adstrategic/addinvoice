import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  getProposalByAcceptToken,
  getProposalPdfByAcceptToken,
  acceptProposalByToken,
  rejectProposalByToken,
  type AcceptProposalByTokenBody,
  type RejectProposalByTokenBody,
} from "../service/public-proposals.service";
import { proposalKeys } from "./useProposals";
import { toast } from "sonner";

/** Query keys for public proposal-by-token (accept flow). */
export const publicProposalKeys = {
  accept: (token: string) =>
    [...proposalKeys.all, "public-accept", token] as const,
  pdf: (token: string) =>
    [...proposalKeys.all, "public-accept-pdf", token] as const,
};

/**
 * Fetch proposal summary by accept token (public, no auth).
 * Use for the proposal accept page; data is a result union (ready | not_found | already_accepted | already_rejected).
 */
export function useProposalForAccept(token: string | undefined) {
  return useQuery({
    queryKey: publicProposalKeys.accept(token!),
    queryFn: () => getProposalByAcceptToken(token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProposalPdfForAccept(token: string | undefined) {
  return useQuery({
    queryKey: publicProposalKeys.pdf(token!),
    queryFn: () => getProposalPdfByAcceptToken(token!),
    enabled: !!token,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Accept proposal by token (public, no auth).
 * On 409, treats as "already accepted" and does not show generic error toast.
 */
export function useAcceptProposalByToken(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, AcceptProposalByTokenBody>({
    mutationFn: (body: AcceptProposalByTokenBody) =>
      acceptProposalByToken(token!, body),
    onSuccess: () => {
      if (token) {
        queryClient.invalidateQueries({
          queryKey: publicProposalKeys.accept(token),
        });
      }
      toast.success("Proposal accepted", {
        description: "Thank you. This proposal has been accepted successfully.",
      });
    },
    onError: (err) => {
      toast.error("Acceptance failed", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    },
  }) as UseMutationResult<
    { message: string },
    Error,
    AcceptProposalByTokenBody
  >;
}

/**
 * Reject proposal by token (public, no auth).
 * On 409, treats as "already accepted" and does not show generic error toast.
 */
export function useRejectProposalByToken(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, RejectProposalByTokenBody>({
    mutationFn: (body: RejectProposalByTokenBody) =>
      rejectProposalByToken(token!, body),
    onSuccess: () => {
      if (token) {
        queryClient.invalidateQueries({
          queryKey: publicProposalKeys.accept(token),
        });
      }
      toast.success("Proposal rejected", {
        description:
          "You have rejected this proposal. Thank you for your feedback.",
      });
    },
    onError: (err) => {
      toast.error("Rejection failed", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    },
  }) as UseMutationResult<
    { message: string },
    Error,
    RejectProposalByTokenBody
  >;
}
