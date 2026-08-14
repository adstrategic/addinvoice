import { View } from 'react-native'

import { cn } from '@/lib/utils'

export type DividerProps = { className?: string }

/**
 * The `border-t border-border` rule the web setup form uses to separate the
 * business fields, the logo block and the invoice defaults.
 */
export function Divider({ className }: DividerProps) {
	return <View className={cn('h-px w-full bg-border', className)} />
}
