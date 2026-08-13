import { Text as RNText, type TextProps as RNTextProps } from 'react-native'

import { cn } from '@/lib/utils'

type TextVariant = 'body' | 'muted' | 'label' | 'title' | 'heading' | 'error'

const VARIANT_CLASS: Record<TextVariant, string> = {
	// ui-styling: hierarchy comes from weight and color, not many font sizes.
	body: 'font-sans text-base text-foreground',
	muted: 'font-sans text-base text-muted-foreground',
	label: 'font-sans-medium text-sm text-foreground',
	title: 'font-sans-semibold text-lg text-foreground',
	heading: 'font-sans-bold text-2xl text-foreground',
	error: 'font-sans text-sm text-destructive',
}

export type TextProps = RNTextProps & {
	variant?: TextVariant
	className?: string
}

export function Text({ variant = 'body', className, ...props }: TextProps) {
	return <RNText className={cn(VARIANT_CLASS[variant], className)} {...props} />
}
