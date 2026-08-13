import { useAuth } from '@clerk/expo'
import { Stack } from 'expo-router'

import { Button, Card, Screen, Text } from '@/components/ui'

/**
 * Placeholder landing screen — the funnel's destination.
 * Replaced by the real Clients module in the next phase.
 */
export default function ClientsScreen() {
	const { signOut } = useAuth()

	return (
		<>
			<Stack.Screen options={{ title: 'Clients' }} />
			<Screen>
				<Card>
					<Text variant="title">You&apos;re all set</Text>
					<Text variant="muted">
						Your account, trial and business are ready. The Clients module lands in the next
						phase.
					</Text>
				</Card>
				<Button label="Sign out" variant="outline" onPress={() => void signOut()} />
			</Screen>
		</>
	)
}
