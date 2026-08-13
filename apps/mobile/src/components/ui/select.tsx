import { Pressable, View } from 'react-native'

import { cn } from '@/lib/utils'

import { Text } from './text'

export type SelectOption<T extends string> = { value: T; label: string }

export type SelectProps<T extends string> = {
	label?: string
	error?: string
	value: T | null
	options: SelectOption<T>[]
	onChange: (value: T) => void
	className?: string
}

/**
 * Segmented single-choice control. Used for short, fixed option sets (e.g. tax
 * mode) where a picker modal would be more friction than the choice deserves.
 */
export function Select<T extends string>({
	label,
	error,
	value,
	options,
	onChange,
	className,
}: SelectProps<T>) {
	return (
		<View className={cn('gap-1.5', className)}>
			{label ? <Text variant="label">{label}</Text> : null}
			<View className="gap-2">
				{options.map((option) => {
					const isSelected = option.value === value
					return (
						<Pressable
							key={option.value}
							accessibilityRole="radio"
							accessibilityState={{ selected: isSelected }}
							onPress={() => onChange(option.value)}
							style={{ borderCurve: 'continuous' }}
							className={cn(
								'min-h-12 justify-center rounded-lg border px-4 py-3',
								isSelected ? 'border-primary bg-primary/10' : 'border-input bg-background',
							)}
						>
							<Text className={isSelected ? 'font-sans-semibold text-primary' : ''}>
								{option.label}
							</Text>
						</Pressable>
					)
				})}
			</View>
			{error ? <Text variant="error">{error}</Text> : null}
		</View>
	)
}
