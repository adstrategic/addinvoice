import { View } from 'react-native'

import { cn } from '@/lib/utils'

import { Text } from './text'

type BadgeTone = 'primary' | 'indigo' | 'muted'

const CONTAINER_CLASS: Record<BadgeTone, string> = {
	primary: 'bg-primary/20',
	indigo: 'bg-indigo-500/15',
	muted: 'bg-muted',
}

const LABEL_CLASS: Record<BadgeTone, string> = {
	primary: 'text-primary',
	indigo: 'text-indigo-600',
	muted: 'text-muted-foreground',
}

export type BadgeProps = {
	label: string
	tone?: BadgeTone
	className?: string
}

/** Tinted pill — mirrors the web `Badge` used for a client's business name. */
export function Badge({ label, tone = 'primary', className }: BadgeProps) {
	return (
		<View
			// ui-styling: borderCurve pairs with every borderRadius.
			style={{ borderCurve: 'continuous' }}
			className={cn('self-start rounded-md px-2.5 py-1', CONTAINER_CLASS[tone], className)}
		>
			<Text className={cn('font-sans-medium text-xs', LABEL_CLASS[tone])} numberOfLines={1}>
				{label}
			</Text>
		</View>
	)
}
