import { forwardRef } from 'react'
import { TextInput, type TextInputProps, View } from 'react-native'

import { cn } from '@/lib/utils'

import { FieldLabel } from './field'
import { Text } from './text'

/** muted-foreground; the default placeholder colour on a light background. */
const PLACEHOLDER_LIGHT = '#58666a'

export type InputProps = TextInputProps & {
	label?: string
	error?: string
	/** Renders the web's red asterisk after the label. */
	required?: boolean
	/** Muted label treatment, matching the web's invoice-defaults sub-fields. */
	labelMuted?: boolean
	/** Approximates the web `<Textarea rows={n}>` height. Implies multiline. */
	rows?: number
	className?: string
	containerClassName?: string
	labelClassName?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
	{
		label,
		error,
		required = false,
		labelMuted = false,
		rows,
		className,
		containerClassName,
		labelClassName,
		placeholderTextColor,
		multiline,
		...props
	},
	ref,
) {
	const isMultiline = multiline ?? rows != null

	return (
		<View className={cn('gap-1.5', containerClassName)}>
			{label ? (
				<FieldLabel required={required} muted={labelMuted} className={labelClassName}>
					{label}
				</FieldLabel>
			) : null}
			<TextInput
				ref={ref}
				placeholderTextColor={placeholderTextColor ?? PLACEHOLDER_LIGHT}
				multiline={isMultiline}
				// textAlignVertical keeps Android's multiline caret at the top rather
				// than vertically centred in the box.
				textAlignVertical={isMultiline ? 'top' : 'center'}
				style={{
					borderCurve: 'continuous',
					...(rows != null ? { minHeight: 24 * rows + 24 } : null),
				}}
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
