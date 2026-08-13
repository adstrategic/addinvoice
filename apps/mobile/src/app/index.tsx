import { useAuth } from '@clerk/expo'
import { Redirect } from 'expo-router'

import { Button, Screen, Spinner, Text, View } from '@/components/ui'
import { useOnboardingFunnel } from '@/hooks/use-onboarding-funnel'

/**
 * Splash gate. Resolves which funnel step this session belongs on and redirects
 * there, so a cold start always resumes where the user left off.
 */
export default function IndexScreen() {
	const { isLoaded, isSignedIn } = useAuth()
	// requiredStep is a step this screen can never be, so redirectPath is always
	// set once the queries resolve.
	const { redirectPath, isLoading, hasQueryError, refetchAll } = useOnboardingFunnel({
		requiredStep: 'dashboard',
		// Redirecting is this screen's whole job, but it happens through <Redirect>
		// below so the navigation is declarative rather than an effect race.
		enabled: false,
	})

	if (!isLoaded) {
		return <Spinner fullScreen />
	}

	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />
	}

	if (hasQueryError) {
		return (
			<Screen center>
				<View className="gap-2">
					<Text variant="title">We couldn&apos;t load your account</Text>
					<Text variant="muted">Check your connection and try again.</Text>
				</View>
				<Button label="Retry" onPress={() => void refetchAll()} />
			</Screen>
		)
	}

	if (isLoading) {
		return <Spinner fullScreen />
	}

	return <Redirect href={redirectPath ?? '/(main)/clients'} />
}
