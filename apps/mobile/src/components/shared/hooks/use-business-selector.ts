import type { BusinessResponse } from '@addinvoice/schemas'
import { useCallback, useState } from 'react'

import { useBusinesses } from '@/features/businesses/hooks/use-businesses'

/**
 * Picks the business a new document should start with.
 *
 * Diverges from the web deliberately. The web auto-picks only when there is
 * exactly one business and ignores `isDefault` entirely — a heuristic
 * duplicated across four form managers. Since setup already promotes the first
 * business to default, honouring the flag removes a prompt that has an obvious
 * right answer.
 */
export function pickInitialBusiness(
	businesses: BusinessResponse[],
): BusinessResponse | undefined {
	return businesses.find((business) => business.isDefault) ?? (businesses.length === 1 ? businesses[0] : undefined)
}

export type UseBusinessSelectorResult = {
	businesses: BusinessResponse[]
	selectedBusiness: BusinessResponse | null
	isPickerOpen: boolean
	isLoading: boolean
	/**
	 * Resolves a business without prompting when the answer is unambiguous, and
	 * opens the picker when it isn't. Returns the business if one was resolved
	 * synchronously, so callers can continue in the same tick.
	 */
	requireBusiness: () => BusinessResponse | undefined
	select: (business: BusinessResponse) => void
	clear: () => void
	closePicker: () => void
}

export function useBusinessSelector(options?: {
	enabled?: boolean
}): UseBusinessSelectorResult {
	const { data, isLoading } = useBusinesses(undefined, { enabled: options?.enabled ?? true })
	const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null)
	const [isPickerOpen, setIsPickerOpen] = useState(false)

	const businesses = data?.data ?? []

	const requireBusiness = useCallback(() => {
		if (selectedBusiness) return selectedBusiness

		const list = data?.data ?? []
		const auto = pickInitialBusiness(list)
		if (auto) {
			setSelectedBusiness(auto)
			return auto
		}

		setIsPickerOpen(true)
		return undefined
	}, [data, selectedBusiness])

	const select = useCallback((business: BusinessResponse) => {
		setSelectedBusiness(business)
		setIsPickerOpen(false)
	}, [])

	const clear = useCallback(() => setSelectedBusiness(null), [])
	const closePicker = useCallback(() => setIsPickerOpen(false), [])

	return {
		businesses,
		selectedBusiness,
		isPickerOpen,
		isLoading,
		requireBusiness,
		select,
		clear,
		closePicker,
	}
}
