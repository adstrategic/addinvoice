import { View, type ViewProps } from 'react-native'

import { cn } from '@/lib/utils'

export type CardProps = ViewProps & { className?: string }

// ui-styling: continuous curve + boxShadow string, not the legacy shadow* props.
const BASE_STYLE = { borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(2, 11, 15, 0.06)' } as const

export function Card({ className, style, ...props }: CardProps) {
	return (
		<View
			// Merged rather than spread-over, so a caller adding (say) a coloured
			// left border does not silently drop the shadow and border curve.
			style={style ? [BASE_STYLE, style] : BASE_STYLE}
			className={cn('gap-3 rounded-lg border border-border bg-card p-4', className)}
			{...props}
		/>
	)
}
