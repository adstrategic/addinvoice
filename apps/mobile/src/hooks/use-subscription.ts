import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	subscriptionsService,
	type SubscriptionStatusResponse,
} from '@/features/subscriptions/service/subscriptions.service'
import { handleMutationError } from '@/lib/errors/handle-error'

export const subscriptionKeys = {
	all: ['subscription'] as const,
	status: () => [...subscriptionKeys.all, 'status'] as const,
}

export function useSubscription(options?: { enabled?: boolean }) {
	return useQuery<SubscriptionStatusResponse>({
		queryKey: subscriptionKeys.status(),
		queryFn: () => subscriptionsService.getStatus(),
		staleTime: 60 * 1000,
		enabled: options?.enabled ?? true,
	})
}

export function useActivateTrial() {
	const queryClient = useQueryClient()

	return useMutation<SubscriptionStatusResponse, unknown, void>({
		mutationFn: () => subscriptionsService.activateTrial(),
		onSuccess: (status) => {
			// Seed the fresh status before invalidating so the funnel never reads a
			// stale inactive subscription between the two.
			queryClient.setQueryData(subscriptionKeys.status(), status)
			queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() })
		},
		onError: (error) => handleMutationError(error),
	})
}

/**
 * App Store 3.1.1 — useSubscriptionPlans, useCreateCheckout and
 * useCreatePortalSession are deliberately not ported. See
 * features/subscriptions/service/subscriptions.service.ts.
 */
