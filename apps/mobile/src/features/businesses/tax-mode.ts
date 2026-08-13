/**
 * Local mirror of TaxMode.
 *
 * packages/schemas/src/enums.ts defines it and business.base.ts validates
 * against it, but enums.ts is not re-exported from the package barrel, so it
 * cannot be imported. Promoting the enums to the barrel is tracked as a
 * follow-up; until then these values must stay identical to that file.
 */
export const TaxMode = {
	BY_PRODUCT: 'BY_PRODUCT',
	BY_TOTAL: 'BY_TOTAL',
	NONE: 'NONE',
} as const

export type TaxMode = (typeof TaxMode)[keyof typeof TaxMode]
