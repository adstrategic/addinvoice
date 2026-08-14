import { Pressable, View } from 'react-native'

import { Text } from '@/components/ui'
import type { OnboardingOption } from '@/features/onboarding/questions'
import { cn } from '@/lib/utils'

export type OnboardingQuestionProps = {
	question: string
	options: OnboardingOption[]
	selectedOptionId: string | null
	/** Highlights the "Other" tile while its free-text answer is pending. */
	pendingOtherId?: string | null
	onSelect: (optionId: string) => void
}

/**
 * The onboarding question and its option tiles, mirroring
 * `apps/frontend/app/onboarding/page.tsx`.
 *
 * The whole screen sits on a solid dark teal, so every surface here is a
 * translucent white overlay rather than a themed token — the web achieves the
 * same look with `bg-white/10` over a photographic background. There is no
 * backdrop blur: over a flat colour it would be a no-op that costs a render
 * pass on Android.
 */
export function OnboardingQuestionCard({
	question,
	options,
	selectedOptionId,
	pendingOtherId = null,
	onSelect,
}: OnboardingQuestionProps) {
	return (
		<View className="gap-8">
			<View
				style={{ borderCurve: 'continuous' }}
				className="rounded-xl border border-white/20 bg-white/10 p-4"
			>
				<Text className="font-sans-bold text-2xl leading-tight text-white">{question}</Text>
			</View>

			<View className="gap-3">
				{options.map((option) => {
					const isSelected = option.id === selectedOptionId
					const isPendingOther = option.id === pendingOtherId

					return (
						<Pressable
							key={option.id}
							accessibilityRole="radio"
							accessibilityState={{ selected: isSelected }}
							onPress={() => onSelect(option.id)}
							style={{
								borderCurve: 'continuous',
								boxShadow: '0 4px 12px rgba(2, 11, 15, 0.15)',
							}}
							className={cn(
								'min-h-14 flex-row items-center gap-4 rounded-xl border px-4 py-3',
								isSelected || isPendingOther
									? 'border-white/60 bg-white/20'
									: 'border-white/20 bg-white/10',
							)}
						>
							<View
								className={cn(
									'h-8 w-8 shrink-0 items-center justify-center rounded-full border',
									isSelected || isPendingOther
										? 'border-white bg-white'
										: 'border-white/30 bg-white/10',
								)}
							>
								<Text
									className={cn(
										'font-sans-bold text-sm',
										isSelected || isPendingOther ? 'text-primary-dark' : 'text-white',
									)}
								>
									{option.id}
								</Text>
							</View>
							<Text className="flex-1 font-sans-medium text-base leading-snug text-white">
								{option.text}
							</Text>
						</Pressable>
					)
				})}
			</View>
		</View>
	)
}
