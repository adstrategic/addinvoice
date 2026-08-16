import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { referralsService } from "@/features/referrals/service/referrals.service"

/**
 * Query key factory for referral queries
 */
export const referralKeys = {
	all: ["referral"] as const,
	mine: () => [...referralKeys.all, "mine"] as const,
}

export interface UseMyReferralOptions {
	enabled?: boolean
}

/**
 * Hook to fetch the referral attached to the current workspace.
 */
export function useMyReferral(options?: UseMyReferralOptions) {
	return useQuery({
		queryKey: referralKeys.mine(),
		queryFn: () => referralsService.getMyReferral(),
		staleTime: 60 * 1000,
		enabled: options?.enabled ?? true,
	})
}

/**
 * Hook to attach a referral code to the current workspace.
 */
export function useAttachReferral() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (code: string) => referralsService.attachReferral(code),
		onSuccess: (referral) => {
			queryClient.setQueryData(referralKeys.mine(), referral)
		},
	})
}

/**
 * Hook to remove a not-yet-converted referral.
 */
export function useDetachReferral() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => referralsService.detachReferral(),
		onSuccess: () => {
			queryClient.setQueryData(referralKeys.mine(), null)
		},
	})
}
