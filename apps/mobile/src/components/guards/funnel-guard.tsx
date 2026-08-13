import type { ReactNode } from 'react'

import { Button, Screen, Spinner, Text, View } from '@/components/ui'
import { useOnboardingFunnel } from '@/hooks/use-onboarding-funnel'
import type { FunnelStep } from '@/lib/funnel'

export type FunnelGuardProps = {
	children: ReactNode
	requiredStep: FunnelStep
	/** Set false to suspend redirects, e.g. during a completion animation. */
	enabled?: boolean
}

export function FunnelGuard({ children, requiredStep, enabled = true }: FunnelGuardProps) {
	const { isLoading, hasQueryError, isReady, refetchAll } = useOnboardingFunnel({
		requiredStep,
		enabled,
	})

	if (hasQueryError) {
		return (
			<Screen center>
				<View className="gap-2">
					<Text variant="title">We couldn&apos;t load your account</Text>
					<Text variant="muted">
						Check your connection and try again. Your data is safe.
					</Text>
				</View>
				<Button label="Retry" onPress={() => void refetchAll()} />
			</Screen>
		)
	}

	if (isLoading || !isReady) {
		return <Spinner fullScreen />
	}

	return <>{children}</>
}
