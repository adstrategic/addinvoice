import { apiClient } from '@/lib/api/client'
import type { ApiSuccessResponse } from '@/lib/api/types'
import { handleApiError } from '@/lib/errors/handler'

const BASE_URL = '/subscription'

export type PaidSubscriptionPlan = 'MINIMUM' | 'ESSENTIAL' | 'LIFETIME'
export type SubscriptionPlan = PaidSubscriptionPlan | 'FREE_TRIAL'
export type SubscriptionStatus =
	| 'ACTIVE'
	| 'CANCELED'
	| 'PAST_DUE'
	| 'UNPAID'
	| 'INCOMPLETE'
	| 'INCOMPLETE_EXPIRED'
	| 'TRIALING'

export interface TrialModuleUsage {
	used: number
	limit: number
}

export interface TrialUsageSummary {
	invoices: TrialModuleUsage
	estimates: TrialModuleUsage
	proposals: TrialModuleUsage
	expenses: TrialModuleUsage
	advances: TrialModuleUsage
	catalog: TrialModuleUsage
	clients: TrialModuleUsage
	payments: TrialModuleUsage
	emails: TrialModuleUsage
}

export interface VoiceUsageSummary {
	used: number
	limit: number
	windowEnd: string | null
}

export interface SubscriptionStatusResponse {
	isActive: boolean
	plan: SubscriptionPlan | null
	status: SubscriptionStatus | null
	hasEverPaid: boolean
	trialUsage?: TrialUsageSummary
	voiceUsage?: VoiceUsageSummary
}

async function getStatus(): Promise<SubscriptionStatusResponse> {
	try {
		const { data } = await apiClient.get<ApiSuccessResponse<SubscriptionStatusResponse>>(
			`${BASE_URL}/status`,
		)
		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

async function activateTrial(): Promise<SubscriptionStatusResponse> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<SubscriptionStatusResponse>>(
			`${BASE_URL}/trial/activate`,
		)
		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

/**
 * App Store 3.1.1 — deliberately incomplete.
 *
 * The web service also exposes getPlans, createCheckout and createPortalSession.
 * None of them are ported: each exists to sell or change a paid plan, and a
 * digital subscription consumed in-app must use In-App Purchase. Paid conversion
 * happens on the web under Guideline 3.1.3(b). Do not add them back.
 */
export const subscriptionsService = {
	getStatus,
	activateTrial,
}
