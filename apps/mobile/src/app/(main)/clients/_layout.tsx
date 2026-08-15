import { Stack } from 'expo-router'

/**
 * ui-native-modals: create and edit are native form sheets rather than a JS
 * bottom-sheet library, so swipe-to-dismiss, keyboard avoidance and
 * accessibility come from the platform. Same shape as the businesses stack.
 *
 * The list keeps `headerLargeTitle` so the native search bar collapses with it.
 */
export default function ClientsLayout() {
	return (
		<Stack screenOptions={{ headerLargeTitle: true }}>
			<Stack.Screen name="index" options={{ title: 'Clients' }} />
			<Stack.Screen
				name="create"
				options={{ title: 'Create New Client', presentation: 'formSheet', headerLargeTitle: false }}
			/>
			<Stack.Screen name="[sequence]/index" options={{ title: '', headerLargeTitle: false }} />
			<Stack.Screen
				name="[sequence]/edit"
				options={{ title: 'Edit Client', presentation: 'formSheet', headerLargeTitle: false }}
			/>
		</Stack>
	)
}
