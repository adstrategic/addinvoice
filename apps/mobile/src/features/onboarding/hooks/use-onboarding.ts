import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	onboardingService,
	type CompleteOnboardingRequest,
	type OnboardingStatus,
} from '@/features/onboarding/service/onboarding.service'
import { ApiError } from '@/lib/errors/handler'

export const onboardingKeys = {
	all: ['onboarding'] as const,
	status: () => [...onboardingKeys.all, 'status'] as const,
}

export function useOnboardingStatus(options?: { enabled?: boolean }) {
	return useQuery<OnboardingStatus>({
		queryKey: onboardingKeys.status(),
		queryFn: () => onboardingService.getStatus(),
		staleTime: Infinity,
		enabled: options?.enabled ?? true,
	})
}

export function useCompleteOnboarding() {
	const queryClient = useQueryClient()

	return useMutation<OnboardingStatus, unknown, CompleteOnboardingRequest>({
		mutationFn: (payload) => onboardingService.complete(payload),
		onSuccess: (data) => {
			// Patch the cache instead of invalidating. invalidateQueries starts an
			// async refetch, and FunnelGuard reads the stale completedAt:null during
			// that window and bounces straight back to onboarding — even though the
			// record is already saved.
			queryClient.setQueryData<OnboardingStatus>(onboardingKeys.status(), (prev) => ({
				completedAt: data.completedAt,
				answers: data.answers,
				onboardingTourCompletedAt: prev?.onboardingTourCompletedAt ?? null,
			}))
		},
		onError: (error) => {
			// 409 means the DB record already exists and only the cache was stale.
			// onError runs before mutateAsync rejects, so the screen's catch block
			// navigates with a correct cache.
			if (error instanceof ApiError && error.statusCode === 409) {
				queryClient.setQueryData<OnboardingStatus>(onboardingKeys.status(), (prev) =>
					prev?.completedAt
						? prev
						: {
								completedAt: new Date().toISOString(),
								answers: prev?.answers ?? null,
								onboardingTourCompletedAt: prev?.onboardingTourCompletedAt ?? null,
							},
				)
			}
		},
	})
}
