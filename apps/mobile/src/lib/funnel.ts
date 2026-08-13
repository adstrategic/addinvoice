import type { Href } from 'expo-router'

export type FunnelStep = 'onboarding' | 'subscribe' | 'setup' | 'dashboard'

export type FunnelState = {
	onboardingCompleted: boolean
	subscriptionActive: boolean
	hasBusiness: boolean
}

/**
 * Mobile route targets for each step. The step names match the web so the
 * resolver logic ports unchanged; only the destinations differ.
 *
 * `subscribe` points at the trial screen, not a purchase flow: activating
 * FREE_TRIAL involves no money, so it is account provisioning rather than a
 * purchase (App Store 3.1.1). A user who cannot claim a trial is sent onward to
 * the terminal subscription-required screen instead.
 */
export const FUNNEL_PATHS: Record<FunnelStep, Href> = {
	onboarding: '/(funnel)/onboarding',
	subscribe: '/(funnel)/trial',
	setup: '/(funnel)/setup',
	dashboard: '/(main)/clients',
}

const STEP_ORDER: FunnelStep[] = ['onboarding', 'subscribe', 'setup', 'dashboard']

export function resolveFunnelStep(state: FunnelState): FunnelStep {
	if (!state.onboardingCompleted) return 'onboarding'
	if (!state.subscriptionActive) return 'subscribe'
	if (!state.hasBusiness) return 'setup'
	return 'dashboard'
}

export function getFunnelRedirectPath(actualStep: FunnelStep, pageStep: FunnelStep): Href | null {
	if (actualStep === pageStep) return null
	return FUNNEL_PATHS[actualStep]
}

export function getFunnelStepIndex(step: FunnelStep): number {
	return STEP_ORDER.indexOf(step)
}
