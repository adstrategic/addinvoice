import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Text } from '@/components/ui'

export type EmptyStateProps = {
	icon: ReactNode
	title: string
	description?: string
	action?: ReactNode
}

/**
 * Shared "nothing here yet" block for module lists.
 *
 * The web inlines this per module (`ClientList.tsx` renders a Building2 icon and
 * "No clients found"); on mobile it is one component so every list reads the
 * same.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
	return (
		<View className="items-center gap-3 px-6 py-12">
			{icon}
			<Text variant="title">{title}</Text>
			{description ? (
				<Text variant="muted" className="text-center">
					{description}
				</Text>
			) : null}
			{action}
		</View>
	)
}
