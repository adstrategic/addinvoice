import { create } from 'zustand'

import type { ApiErrorCode } from '@/lib/api/types'

/**
 * Replaces the web's lib/upgrade-dialog/store.ts.
 *
 * App Store 3.1.1: this store may only ever carry a factual status message.
 * It must never hold prices, plan names, or a link to a purchase flow.
 */
type UpgradeState = {
	isOpen: boolean
	code: ApiErrorCode | null
	message: string | null
	show: (payload: { code: ApiErrorCode; message: string }) => void
	hide: () => void
}

export const useUpgradeStore = create<UpgradeState>((set) => ({
	isOpen: false,
	code: null,
	message: null,
	show: ({ code, message }) => set({ isOpen: true, code, message }),
	hide: () => set({ isOpen: false, code: null, message: null }),
}))
