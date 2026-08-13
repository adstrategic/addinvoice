import { forwardRef } from 'react'
import { TextInput, type TextInputProps, View } from 'react-native'

import { cn } from '@/lib/utils'

import { Text } from './text'

export type InputProps = TextInputProps & {
	label?: string
	error?: string
	className?: string
	containerClassName?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
	{ label, error, className, containerClassName, ...props },
	ref,
) {
	return (
		<View className={cn('gap-1.5', containerClassName)}>
			{label ? <Text variant="label">{label}</Text> : null}
			<TextInput
				ref={ref}
				placeholderTextColor="#58666a"
				style={{ borderCurve: 'continuous' }}
				className={cn(
					'min-h-12 rounded-lg border bg-background px-4 py-3 font-sans text-base text-foreground',
					error ? 'border-destructive' : 'border-input',
					className,
				)}
				{...props}
			/>
			{error ? <Text variant="error">{error}</Text> : null}
		</View>
	)
})
