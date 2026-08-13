import { useAuth } from '@clerk/expo'

import { Button, Screen, Text, View } from '@/components/ui'

/**
 * Terminal state for a workspace with no usable plan — trial exhausted, or a
 * paid plan lapsed.
 *
 * App Store 3.1.1: this screen states account status and stops. Naming the
 * domain as a fact is materially different from offering a tappable link, and
 * there is deliberately no button, no WebBrowser call, and no wording that
 * steers the user toward buying elsewhere — Apple treats steering language as a
 * violation independently of the link itself.
 */
export default function SubscriptionRequiredScreen() {
	const { signOut } = useAuth()

	return (
		<Screen center>
			<View className="gap-3">
				<Text variant="heading">Your plan is inactive</Text>
				<Text variant="muted">
					Your trial limit has been reached. Your plan can be managed from your account on
					addinvoices.com.
				</Text>
			</View>

			<Button label="Sign out" variant="outline" onPress={() => void signOut()} />
		</Screen>
	)
}
