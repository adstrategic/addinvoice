import { Card, Screen, Text } from '@/components/ui'

export type ComingSoonProps = {
	title: string
	description: string
}

/**
 * Placeholder body for a tab whose feature has not been built yet.
 *
 * The five tabs ship together so the navigation shape is fixed early, but Home,
 * Invoices and Estimates land in their own phases. Delete each usage as its
 * screen arrives.
 */
export function ComingSoon({ title, description }: ComingSoonProps) {
	return (
		<Screen contentClassName="gap-6">
			<Text variant="heading">{title}</Text>
			<Card>
				<Text variant="title">Coming soon</Text>
				<Text variant="muted">{description}</Text>
			</Card>
		</Screen>
	)
}
