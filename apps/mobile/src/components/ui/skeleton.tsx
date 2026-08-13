import { View } from 'react-native'

import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
	return (
		<View
			style={{ borderCurve: 'continuous' }}
			className={cn('h-4 rounded-md bg-muted', className)}
		/>
	)
}
