import { apiClient } from "@/lib/api/client"
import { handleApiError } from "@/lib/errors/handler"
import type { ApiSuccessResponse } from "@/lib/api/types"

const BASE_URL = "/admin/referrals"

/** Money totals are grouped by currency and never summed across them. */
export interface ReferrerTotals {
	currency: string
	pendingCents: number
	approvedCents: number
	paidCents: number
}

export interface AdminReferrer {
	id: number
	name: string
	email: string
	code: string
	status: "ACTIVE" | "PAUSED"
	commissionRatePct: number
	commissionMonths: number
	referralCount: number
	convertedCount: number
	totals: ReferrerTotals[]
}

export interface AdminReferralRow {
	id: number
	status: "PENDING" | "CONVERTED"
	workspaceName: string
	attributedAt: string
	convertedAt: string | null
	commissionEndsAt: string | null
}

export interface AdminCommissionRow {
	id: number
	amountCents: number
	baseAmountCents: number
	currency: string
	status: "PENDING" | "APPROVED" | "PAID" | "REVERSED"
	availableAt: string
	createdAt: string
	stripeInvoiceId: string | null
}

export interface AdminPayoutRow {
	id: number
	amountCents: number
	currency: string
	method: string | null
	reference: string | null
	note: string | null
	paidAt: string
}

export interface AdminReferrerDetail extends AdminReferrer {
	referrals: AdminReferralRow[]
	commissions: AdminCommissionRow[]
	payouts: AdminPayoutRow[]
}

async function listReferrers(): Promise<AdminReferrer[]> {
	try {
		const { data } =
			await apiClient.get<ApiSuccessResponse<AdminReferrer[]>>(
				`${BASE_URL}/referrers`,
			)

		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

async function getReferrer(id: number): Promise<AdminReferrerDetail> {
	try {
		const { data } = await apiClient.get<
			ApiSuccessResponse<AdminReferrerDetail>
		>(`${BASE_URL}/referrers/${id}`)

		return data.data
	} catch (error) {
		handleApiError(error)
	}
}

export const referralsAdminService = {
	listReferrers,
	getReferrer,
}
