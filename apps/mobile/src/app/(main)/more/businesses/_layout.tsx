import { Stack } from 'expo-router'

/**
 * ui-native-modals: create and edit are native form sheets rather than a JS
 * bottom-sheet library, so swipe-to-dismiss, keyboard avoidance and
 * accessibility come from the platform.
 */
export default function BusinessesLayout() {
	return (
		<Stack screenOptions={{ headerLargeTitle: true }}>
			<Stack.Screen name="index" options={{ title: 'Companies' }} />
			<Stack.Screen
				name="create"
				options={{
					title: 'Add Company',
					presentation: 'formSheet',
					headerLargeTitle: false,
				}}
			/>
			<Stack.Screen
				name="[id]/edit"
				options={{
					title: 'Edit Company',
					presentation: 'formSheet',
					headerLargeTitle: false,
				}}
			/>
		</Stack>
	)
}
