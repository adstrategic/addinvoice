import { Stack } from 'expo-router'

/**
 * Overflow tab — mirrors the More drawer in the web `bottom-nav.tsx`.
 *
 * Businesses lives under here rather than beside the tabs: every direct child of
 * a NativeTabs layout has to be a Trigger, and Companies is a settings
 * drill-down, not a tab.
 */
export default function MoreLayout() {
	return (
		<Stack screenOptions={{ headerLargeTitle: true }}>
			<Stack.Screen name="index" options={{ title: 'More' }} />
			<Stack.Screen name="businesses" options={{ headerShown: false }} />
		</Stack>
	)
}
