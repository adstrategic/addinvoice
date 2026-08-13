import { useAuth } from '@clerk/expo'
import { Redirect, Stack } from 'expo-router'

import { Spinner } from '@/components/ui'

/** Pre-app gates. Requires a session but no business or subscription yet. */
export default function FunnelLayout() {
	const { isLoaded, isSignedIn } = useAuth()

	if (!isLoaded) {
		return <Spinner fullScreen />
	}

	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />
	}

	return <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
}
