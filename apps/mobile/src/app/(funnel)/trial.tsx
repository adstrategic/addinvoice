import { router } from 'expo-router'
import { useState } from 'react'

import { FunnelGuard } from '@/components/guards/funnel-guard'
import { Button, Card, Screen, Text, View } from '@/components/ui'
import { useActivateTrial, useSubscription } from '@/hooks/use-subscription'
import { ApiError } from '@/lib/errors/handler'

/**
 * Activates the free trial.
 *
 * App Store 3.1.1 / 3.1.3(b): activating FREE_TRIAL moves no money, so it is
 * account provisioning rather than a purchase and belongs in the app. This
 * screen must never render a price, a plan tier, or a route to checkout.
 */
export default function TrialScreen() {
	const activateTrial = useActivateTrial()
	const { refetch: refetchSubscription } = useSubscription()
	const [formError, setFormError] = useState<string | null>(null)

	async function handleActivate() {
		setFormError(null)
		try {
			await activateTrial.mutateAsync()
			router.replace('/(funnel)/setup')
		} catch (error) {
			// TRIAL_NOT_AVAILABLE means this workspace already had a trial or a paid
			// plan. Refetching lets the funnel resolver decide where they belong
			// rather than guessing here.
			if (error instanceof ApiError && error.code === 'TRIAL_NOT_AVAILABLE') {
				await refetchSubscription()
				router.replace('/(funnel)/subscription-required')
				return
			}
			setFormError('We could not start your trial. Please try again.')
		}
	}

	return (
		<FunnelGuard requiredStep="subscribe">
			<Screen center>
				<View className="gap-2">
					<Text variant="heading">Start your free trial</Text>
					<Text variant="muted">
						Create invoices, estimates, clients and expenses right away.
					</Text>
				</View>

				<Card>
					<Text variant="label">What&apos;s included</Text>
					<Text variant="muted">
						Full access to invoices, estimates, clients, catalog, expenses and payments while
						you try the app.
					</Text>
				</Card>

				{formError ? <Text variant="error">{formError}</Text> : null}

				<Button
					label="Start free trial"
					isLoading={activateTrial.isPending}
					onPress={handleActivate}
				/>
			</Screen>
		</FunnelGuard>
	)
}
