import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  getEstimateByAcceptToken,
  getEstimatePdfByAcceptToken,
  acceptEstimateByToken,
  rejectEstimateByToken,
  PublicEstimateError,
  type AcceptEstimateByTokenBody,
  type RejectEstimateByTokenBody,
} from "../service/public-estimates.service";
import { estimateKeys } from "./useEstimates";
import { toast } from "sonner";

/** Query keys for public estimate-by-token (accept flow). */
export const publicEstimateKeys = {
  accept: (token: string) =>
    [...estimateKeys.all, "public-accept", token] as const,
  pdf: (token: string) => [...estimateKeys.all, "public-accept-pdf", token] as const,
};

/**
 * Fetch estimate summary by accept token (public, no auth).
 * Use for the estimate accept page; data is a result union (ready | not_found | already_accepted | already_rejected).
 */
export function useEstimateForAccept(token: string | undefined) {
  return useQuery({
    queryKey: publicEstimateKeys.accept(token!),
    queryFn: () => getEstimateByAcceptToken(token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useEstimatePdfForAccept(token: string | undefined) {
  return useQuery({
    queryKey: publicEstimateKeys.pdf(token!),
    queryFn: () => getEstimatePdfByAcceptToken(token!),
    enabled: !!token,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Accept estimate by token (public, no auth).
 * On 409, treats as "already accepted" and does not show generic error toast.
 */
export function useAcceptEstimateByToken(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, AcceptEstimateByTokenBody>({
    mutationFn: (body: AcceptEstimateByTokenBody) =>
      acceptEstimateByToken(token!, body),
    onSuccess: () => {
      if (token) {
        queryClient.invalidateQueries({
          queryKey: publicEstimateKeys.accept(token),
        });
      }
      toast.success("Estimate accepted", {
        description: "Thank you. This estimate has been accepted successfully.",
      });
    },
    onError: (err) => {
      if (err instanceof PublicEstimateError && err.code === "CONFLICT") {
        toast.info("Already accepted", {
          description: err.message,
        });
        return;
      }
      toast.error("Acceptance failed", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    },
  }) as UseMutationResult<
    { message: string },
    Error,
    AcceptEstimateByTokenBody
  >;
}

/**
 * Reject estimate by token (public, no auth).
 * On 409, treats as "already accepted" and does not show generic error toast.
 */
export function useRejectEstimateByToken(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, RejectEstimateByTokenBody>({
    mutationFn: (body: RejectEstimateByTokenBody) =>
      rejectEstimateByToken(token!, body),
    onSuccess: () => {
      if (token) {
        queryClient.invalidateQueries({
          queryKey: publicEstimateKeys.accept(token),
        });
      }
      toast.success("Estimate rejected", {
        description:
          "You have rejected this estimate. Thank you for your feedback.",
      });
    },
    onError: (err) => {
      if (err instanceof PublicEstimateError && err.code === "CONFLICT") {
        toast.info("Already accepted", {
          description: err.message,
        });
        return;
      }
      toast.error("Rejection failed", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    },
  }) as UseMutationResult<
    { message: string },
    Error,
    RejectEstimateByTokenBody
  >;
}
