import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { cn } from '@/lib/utils'

import { FieldLabel } from './field'
import { ChevronDownIcon } from './icons'
import { Sheet } from './sheet'
import { Text } from './text'

export type SelectOption<T extends string> = { value: T; label: string }

export type SelectProps<T extends string> = {
	label?: string
	error?: string
	value: T | null
	options: SelectOption<T>[]
	onChange: (value: T) => void
	/**
	 * `segmented` lays every option out inline — good for two or three choices.
	 * `dropdown` shows a trigger that opens a sheet, mirroring the web's
	 * `SelectTrigger` + `SelectContent`.
	 */
	variant?: 'segmented' | 'dropdown'
	/** Shown on the dropdown trigger when nothing is selected. */
	placeholder?: string
	required?: boolean
	labelMuted?: boolean
	className?: string
}

export function Select<T extends string>({
	label,
	error,
	value,
	options,
	onChange,
	variant = 'segmented',
	placeholder = 'Select an option',
	required = false,
	labelMuted = false,
	className,
}: SelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false)
	const selected = options.find((option) => option.value === value) ?? null

	return (
		<View className={cn('gap-1.5', className)}>
			{label ? (
				<FieldLabel required={required} muted={labelMuted}>
					{label}
				</FieldLabel>
			) : null}

			{variant === 'dropdown' ? (
				<>
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ expanded: isOpen }}
						accessibilityLabel={label}
						accessibilityValue={{ text: selected?.label ?? placeholder }}
						onPress={() => setIsOpen(true)}
						style={{ borderCurve: 'continuous' }}
						className={cn(
							'min-h-12 flex-row items-center justify-between gap-2 rounded-lg border bg-background px-4 py-3',
							error ? 'border-destructive' : 'border-input',
						)}
					>
						<Text className={selected ? '' : 'text-muted-foreground'}>
							{selected?.label ?? placeholder}
						</Text>
						<ChevronDownIcon size={18} color="#58666a" />
					</Pressable>

					<Sheet isVisible={isOpen} onClose={() => setIsOpen(false)} title={label}>
						<View className="gap-2">
							{options.map((option) => {
								const isSelected = option.value === value
								return (
									<Pressable
										key={option.value}
										accessibilityRole="radio"
										accessibilityState={{ selected: isSelected }}
										onPress={() => {
											onChange(option.value)
											setIsOpen(false)
										}}
										style={{ borderCurve: 'continuous' }}
										className={cn(
											'min-h-12 justify-center rounded-lg border px-4 py-3',
											isSelected
												? 'border-primary bg-primary/10'
												: 'border-input bg-background',
										)}
									>
										<Text className={isSelected ? 'font-sans-semibold text-primary' : ''}>
											{option.label}
										</Text>
									</Pressable>
								)
							})}
						</View>
					</Sheet>
				</>
			) : (
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
			)}

			{error ? <Text variant="error">{error}</Text> : null}
		</View>
	)
}
