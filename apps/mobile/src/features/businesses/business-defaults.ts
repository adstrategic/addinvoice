import type { BusinessResponse } from '@addinvoice/schemas'

import { TaxMode } from '@/features/businesses/tax-mode'

/** The subset of a document form that a business seeds. */
export type BusinessFormDefaults = {
	businessId: number
	taxMode: TaxMode
	taxName: string | null
	taxPercentage: number | null
	notes: Record<string, unknown> | null
	terms: Record<string, unknown> | null
}

const EMPTY_DEFAULTS: BusinessFormDefaults = {
	businessId: 0,
	taxMode: TaxMode.NONE,
	taxName: null,
	taxPercentage: null,
	notes: null,
	terms: null,
}

/**
 * Rich-text docs are handed to a RichTextEditor, which owns and mutates the
 * document it is given. Sharing the reference with the cached BusinessResponse
 * would let edits to a draft invoice write through into the business record
 * held by React Query. The web assigns these by reference and gets away with it
 * only because its editor replaces the value wholesale.
 */
function cloneDoc(doc: Record<string, unknown> | null | undefined) {
	return doc == null ? null : (structuredClone(doc) as Record<string, unknown>)
}

/** `defaultTaxMode` is nullable on the record but required on a document. */
function toTaxMode(value: BusinessResponse['defaultTaxMode']): TaxMode {
	switch (value) {
		case TaxMode.NONE:
		case TaxMode.BY_PRODUCT:
		case TaxMode.BY_TOTAL:
			return value
		default:
			return TaxMode.NONE
	}
}

/**
 * Maps a business's stored defaults onto the fields a new invoice or estimate
 * starts with. Mirrors `getDefaultValues(business)` in the web's
 * `useInvoiceFormManager.ts`.
 *
 * Apply this only when opening a form for a NEW document. On edit, the values
 * persisted on the document win — the web is careful about this ordering and
 * never overwrites a saved document with the business's current defaults.
 */
export function getBusinessFormDefaults(
	business: BusinessResponse | null | undefined,
): BusinessFormDefaults {
	if (!business) return { ...EMPTY_DEFAULTS }

	return {
		businessId: business.id,
		taxMode: toTaxMode(business.defaultTaxMode),
		taxName: business.defaultTaxName ?? null,
		// Decimal(10,2) arrives as string-or-number depending on the driver.
		taxPercentage:
			business.defaultTaxPercentage != null ? Number(business.defaultTaxPercentage) : null,
		notes: cloneDoc(business.defaultNotes),
		terms: cloneDoc(business.defaultTerms),
	}
}
