import { useAuth } from '@clerk/expo'
import { router } from 'expo-router'
import { useEffect } from 'react'

import { useOnboardingStatus } from '@/features/onboarding/hooks/use-onboarding'
import { useHasBusiness } from '@/hooks/use-has-business'
import { useSubscription } from '@/hooks/use-subscription'
import { getFunnelRedirectPath, resolveFunnelStep, type FunnelStep } from '@/lib/funnel'

type UseOnboardingFunnelOptions = {
	/** The funnel step this screen expects the user to be on. */
	requiredStep: FunnelStep
	/** When false, skips redirect logic (e.g. during a success animation). */
	enabled?: boolean
}

export function useOnboardingFunnel({
	requiredStep,
	enabled = true,
}: UseOnboardingFunnelOptions) {
	const { isLoaded: isAuthLoaded, isSignedIn } = useAuth()

	// Every query is gated on Clerk being ready and a session existing. Firing
	// them earlier sends unauthenticated requests, which fail, drop isLoading to
	// false with undefined data, and bounce the user back to onboarding on every
	// login. ClerkTokenProvider also blocks children until loaded; this is the
	// second belt.
	const isQueryEnabled = isAuthLoaded && isSignedIn === true

	const {
		data: onboarding,
		isLoading: isLoadingOnboarding,
		isError: isErrorOnboarding,
		refetch: refetchOnboarding,
	} = useOnboardingStatus({ enabled: isQueryEnabled })
	const {
		data: subscription,
		isLoading: isLoadingSubscription,
		isError: isErrorSubscription,
		refetch: refetchSubscription,
	} = useSubscription({ enabled: isQueryEnabled })

	const subscriptionActive = Boolean(subscription?.isActive)

	// GET /businesses sits behind the backend's subscription guard, which answers
	// 402 for any workspace that is not ACTIVE or TRIALING. A brand-new user is
	// exactly that, so asking before the trial exists can only ever fail — and a
	// failure here would surface as "we couldn't load your account", blocking the
	// very screens that would fix it. resolveFunnelStep checks subscription
	// before business anyway, so the answer is not needed until the trial is on.
	const {
		hasBusiness,
		isLoading: isLoadingBusiness,
		isError: isErrorBusiness,
		refetch: refetchBusiness,
	} = useHasBusiness({ enabled: isQueryEnabled && subscriptionActive })

	const isLoading =
		!isAuthLoaded ||
		isLoadingOnboarding ||
		isLoadingSubscription ||
		isLoadingBusiness

	const hasQueryError = isErrorOnboarding || isErrorSubscription || isErrorBusiness

	const refetchAll = () =>
		Promise.all([refetchOnboarding(), refetchSubscription(), refetchBusiness()])

	const actualStep = resolveFunnelStep({
		onboardingCompleted: Boolean(onboarding?.completedAt),
		subscriptionActive,
		hasBusiness,
	})

	const redirectPath = getFunnelRedirectPath(actualStep, requiredStep)

	useEffect(() => {
		// A query error must not redirect: the screen shows Retry instead, so a
		// flaky network never dumps a fully set-up user back at onboarding.
		if (!enabled || isLoading || hasQueryError || !redirectPath) return
		router.replace(redirectPath)
	}, [enabled, isLoading, hasQueryError, redirectPath])

	return {
		actualStep,
		redirectPath,
		isLoading,
		hasQueryError,
		refetchAll,
		isReady: !isLoading && !redirectPath,
	}
}
