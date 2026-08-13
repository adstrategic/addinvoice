import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'

import { cn } from '@/lib/utils'

import { Text } from './text'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

const CONTAINER_CLASS: Record<ButtonVariant, string> = {
	primary: 'bg-primary',
	secondary: 'bg-secondary',
	outline: 'border border-border bg-background',
	ghost: 'bg-transparent',
	destructive: 'bg-destructive',
}

const LABEL_CLASS: Record<ButtonVariant, string> = {
	primary: 'text-primary-foreground',
	secondary: 'text-secondary-foreground',
	outline: 'text-foreground',
	ghost: 'text-primary',
	destructive: 'text-destructive-foreground',
}

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
	label: string
	variant?: ButtonVariant
	isLoading?: boolean
	className?: string
}

// ui-pressable: Pressable, never TouchableOpacity.
export function Button({
	label,
	variant = 'primary',
	isLoading = false,
	disabled,
	className,
	...props
}: ButtonProps) {
	const isDisabled = disabled === true || isLoading

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: isDisabled, busy: isLoading }}
			disabled={isDisabled}
			// ui-styling: borderCurve pairs with every borderRadius.
			style={{ borderCurve: 'continuous' }}
			className={cn(
				'min-h-12 flex-row items-center justify-center gap-2 rounded-lg px-5 py-3',
				CONTAINER_CLASS[variant],
				isDisabled ? 'opacity-50' : '',
				className,
			)}
			{...props}
		>
			{isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
			<Text className={cn('font-sans-semibold text-base', LABEL_CLASS[variant])}>{label}</Text>
		</Pressable>
	)
}
