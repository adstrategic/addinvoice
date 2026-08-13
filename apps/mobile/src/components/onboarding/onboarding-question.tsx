import { Pressable, View } from 'react-native'

import { Text } from '@/components/ui'
import type { OnboardingOption } from '@/features/onboarding/questions'
import { cn } from '@/lib/utils'

export type OnboardingQuestionProps = {
	question: string
	options: OnboardingOption[]
	selectedOptionId: string | null
	onSelect: (optionId: string) => void
}

export function OnboardingQuestionCard({
	question,
	options,
	selectedOptionId,
	onSelect,
}: OnboardingQuestionProps) {
	return (
		<View className="gap-4">
			<Text variant="title">{question}</Text>
			<View className="gap-3">
				{options.map((option) => {
					const isSelected = option.id === selectedOptionId
					return (
						<Pressable
							key={option.id}
							accessibilityRole="radio"
							accessibilityState={{ selected: isSelected }}
							onPress={() => onSelect(option.id)}
							style={{ borderCurve: 'continuous' }}
							className={cn(
								'min-h-14 justify-center rounded-lg border px-4 py-3',
								isSelected ? 'border-primary bg-primary/10' : 'border-input bg-card',
							)}
						>
							<Text className={isSelected ? 'font-sans-semibold text-primary' : ''}>
								{option.text}
							</Text>
						</Pressable>
					)
				})}
			</View>
		</View>
	)
}
