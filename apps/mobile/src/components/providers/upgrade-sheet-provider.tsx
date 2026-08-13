import type { ReactNode } from 'react'

import { Button, Sheet, Text } from '@/components/ui'
import { useUpgradeStore } from '@/lib/upgrade/store'

/**
 * Shown when the backend reports a plan limit.
 *
 * App Store 3.1.1 — the copy here states account status and stops. No prices,
 * no plan names, no button that reaches a purchase flow, and no wording that
 * steers the user to buy elsewhere. Apple treats steering language as a
 * violation independently of whether a link is present.
 */
export function UpgradeSheetProvider({ children }: { children: ReactNode }) {
	const isOpen = useUpgradeStore((state) => state.isOpen)
	const message = useUpgradeStore((state) => state.message)
	const hide = useUpgradeStore((state) => state.hide)

	return (
		<>
			{children}
			<Sheet isVisible={isOpen} onClose={hide} title="Plan limit reached">
				<Text variant="muted">{message ?? 'You have reached a limit on your current plan.'}</Text>
				<Text variant="muted">Your plan can be managed from your account on addinvoices.com.</Text>
				<Button label="Close" variant="secondary" onPress={hide} />
			</Sheet>
		</>
	)
}
