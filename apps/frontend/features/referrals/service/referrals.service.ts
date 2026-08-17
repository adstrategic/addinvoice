import { apiClient } from "@/lib/api/client"
import { handleApiError } from "@/lib/errors/handler"
import type { ApiSuccessResponse } from "@/lib/api/types"

const BASE_URL = "/referrals"

export interface ReferralSummary {
	code: string
	discountPct: number
	referrerName: string
	status: "PENDING" | "CONVERTED"
}

/**
 * The referral attached to the current workspace, or null.
 */
async function getMyReferral(): Promise<ReferralSummary | null> {
	try {
		const { data } =
			await apiClient.get<ApiSuccessResponse<ReferralSummary | null>>(
				`${BASE_URL}/me`,
			)

		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

/**
 * Attach a referral code to the current workspace.
 */
async function attachReferral(code: string): Promise<ReferralSummary> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<ReferralSummary>>(
			`${BASE_URL}/attach`,
			{ code },
		)

		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

/**
 * Remove a not-yet-converted referral from the current workspace.
 */
async function detachReferral(): Promise<void> {
	try {
		await apiClient.delete(`${BASE_URL}/me`)
	} catch (error) {
		handleApiError(error)
	}
}

export const referralsService = {
	getMyReferral,
	attachReferral,
	detachReferral,
}
