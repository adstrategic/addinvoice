import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Toaster } from 'sonner-native'

import { ClerkTokenProvider } from '@/components/providers/clerk-token-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { UpgradeSheetProvider } from '@/components/providers/upgrade-sheet-provider'

import '../global.css'

// Core 3 requires the key explicitly — it is no longer read from the environment
// implicitly. Failing loudly here beats a confusing "not configured" at runtime.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
	throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to apps/mobile/.env')
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				{/* tokenCache persists the session in expo-secure-store; without it the
				    user is signed out on every cold start. */}
				<ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
					<QueryProvider>
						<ClerkTokenProvider>
							<UpgradeSheetProvider>
								<StatusBar style="dark" />
								<Stack screenOptions={{ headerShown: false }} />
								<Toaster />
							</UpgradeSheetProvider>
						</ClerkTokenProvider>
					</QueryProvider>
				</ClerkProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	)
}
