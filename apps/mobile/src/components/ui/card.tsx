import { View, type ViewProps } from 'react-native'

import { cn } from '@/lib/utils'

export type CardProps = ViewProps & { className?: string }

export function Card({ className, ...props }: CardProps) {
	return (
		<View
			// ui-styling: continuous curve + boxShadow string, not the legacy shadow* props.
			style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(2, 11, 15, 0.06)' }}
			className={cn('gap-3 rounded-lg border border-border bg-card p-4', className)}
			{...props}
		/>
	)
}
