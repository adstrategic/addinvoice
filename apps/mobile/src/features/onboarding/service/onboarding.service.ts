import { apiClient } from '@/lib/api/client'
import type { ApiSuccessResponse } from '@/lib/api/types'
import { handleApiError } from '@/lib/errors/handler'

const BASE_URL = '/workspace/onboarding'

export interface OnboardingStatus {
	completedAt: string | null
	answers: Record<string, unknown> | null
	onboardingTourCompletedAt: string | null
}

export interface CompleteOnboardingRequest {
	answers: Record<string, unknown>
}

async function getOnboardingStatus(): Promise<OnboardingStatus> {
	try {
		const { data } = await apiClient.get<ApiSuccessResponse<OnboardingStatus>>(BASE_URL)
		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

async function completeOnboarding(
	payload: CompleteOnboardingRequest,
): Promise<OnboardingStatus> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<OnboardingStatus>>(BASE_URL, payload)
		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

export const onboardingService = {
	getStatus: getOnboardingStatus,
	complete: completeOnboarding,
}
