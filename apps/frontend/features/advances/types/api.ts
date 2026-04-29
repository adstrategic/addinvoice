import { AdvanceStatusEnum } from '@addinvoice/schemas'
import type z from 'zod'

type AdvanceStatus = z.infer<typeof AdvanceStatusEnum>

export const ADVANCE_FILTER_VALUES = [
	'all',
	'draft',
	'issued',
	'invoiced',
] as const

/**
 * Map backend status to UI status string
 */
export function mapStatusToUI(status: AdvanceStatus): string {
	const statusMap: Record<AdvanceStatus, string> = {
		DRAFT: 'draft',
		ISSUED: 'issued',
		INVOICED: 'invoiced',
	}
	return statusMap[status] || 'draft'
}

/**
 * Map UI status string to backend status
 */
export function mapUIToStatus(uiStatus: string): AdvanceStatus | null {
	const statusMap: Record<string, AdvanceStatus> = {
		draft: 'DRAFT',
		issued: 'ISSUED',
		invoiced: 'INVOICED',
	}
	return statusMap[uiStatus] || null
}

/**
 * Map URL status filter (UI value) to API list param.
 * "all" → undefined; otherwise map one-to-one to backend status.
 */
export function statusFilterToApiParam(
	statusFilter: string,
): string | undefined {
	if (!statusFilter || statusFilter === 'all') return undefined
	const single = mapUIToStatus(statusFilter)
	return single ?? undefined
}

export type AdvanceImageDraft = {
	id: string
	file?: File
	previewUrl: string
	attachmentId?: number
}
