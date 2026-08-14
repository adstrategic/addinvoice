import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { FunnelGuard } from '@/components/guards/funnel-guard'
import { OnboardingQuestionCard } from '@/components/onboarding/onboarding-question'
import { Input, ProgressBar, Screen, Text } from '@/components/ui'
import { CheckIcon } from '@/components/ui/icons'
import { useCompleteOnboarding } from '@/features/onboarding/hooks/use-onboarding'
import { buildOnboardingAnswers, ONBOARDING_QUESTIONS } from '@/features/onboarding/questions'
import { cn } from '@/lib/utils'

/** primary-dark. Replaces the web's rotating photo backdrop with a flat colour. */
const BACKDROP = 'bg-primary-dark'

export default function OnboardingScreen() {
	const completeOnboarding = useCompleteOnboarding()

	const [currentStep, setCurrentStep] = useState(0)
	const [selections, setSelections] = useState<Record<number, string>>({})
	const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({})
	const [pendingOtherStep, setPendingOtherStep] = useState<number | null>(null)
	const [isFinishing, setIsFinishing] = useState(false)

	const question = ONBOARDING_QUESTIONS[currentStep]
	const isLastStep = currentStep === ONBOARDING_QUESTIONS.length - 1
	const isAwaitingOtherText = pendingOtherStep === currentStep
	const otherOptionId = question?.options.find((o) => o.isOther)?.id ?? null

	async function finish(
		finalSelections: Record<number, string>,
		finalCustomAnswers: Record<number, string>,
	) {
		setIsFinishing(true)

		try {
			await completeOnboarding.mutateAsync({
				answers: buildOnboardingAnswers(finalSelections, finalCustomAnswers),
			})
		} catch {
			// A 409 means onboarding was already recorded; the mutation's onError has
			// already corrected the cache, so moving forward is right either way.
		}

		router.replace('/(funnel)/trial')
	}

	function handleSelect(optionId: string) {
		if (!question) return

		const option = question.options.find((o) => o.id === optionId)

		// "Other" needs its free-text answer before the step can advance.
		if (option?.isOther) {
			setSelections((prev) => ({ ...prev, [currentStep]: optionId }))
			setPendingOtherStep(currentStep)
			return
		}

		setPendingOtherStep(null)
		const updated = { ...selections, [currentStep]: optionId }
		setSelections(updated)

		if (isLastStep) {
			void finish(updated, customAnswers)
			return
		}
		setCurrentStep(currentStep + 1)
	}

	function handleOtherContinue() {
		const trimmed = customAnswers[currentStep]?.trim() ?? ''
		if (!trimmed) return

		const updatedCustom = { ...customAnswers, [currentStep]: trimmed }
		const updatedSelections = { ...selections, [currentStep]: selections[currentStep] ?? 'D' }
		setCustomAnswers(updatedCustom)
		setSelections(updatedSelections)
		setPendingOtherStep(null)

		if (isLastStep) {
			void finish(updatedSelections, updatedCustom)
			return
		}
		setCurrentStep(currentStep + 1)
	}

	function handleBack() {
		setPendingOtherStep(null)
		setCurrentStep(currentStep - 1)
	}

	if (isFinishing) {
		return (
			<Screen center className={BACKDROP} contentClassName="gap-6">
				<StatusBar style="light" />
				<View className="h-20 w-20 items-center justify-center self-center rounded-full bg-background">
					<CheckIcon size={40} color="#00a3ab" strokeWidth={2.5} />
				</View>
				<Text className="text-center font-sans-bold text-3xl leading-tight text-white">
					You&apos;re exactly where you need to be.
				</Text>
				<Text className="text-center font-sans text-base text-white/90">
					Let&apos;s get your business set up so you never have to worry about this again.
				</Text>
			</Screen>
		)
	}

	if (!question) return null

	return (
		// enabled:false while finishing keeps the guard from redirecting mid-transition.
		<FunnelGuard requiredStep="onboarding" enabled={!isFinishing}>
			<Screen avoidKeyboard className={BACKDROP} contentClassName="gap-6">
				<StatusBar style="light" />

				<View className="gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="font-sans-medium text-sm uppercase tracking-widest text-white/90">
							Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
						</Text>
						<Text className="font-sans-bold text-sm tracking-wide text-white">
							AddInvoices
						</Text>
					</View>
					<ProgressBar
						value={((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100}
						trackClassName="bg-white/20"
						fillClassName="bg-white"
					/>
				</View>

				<View className="flex-1 justify-center gap-8 py-4">
					<OnboardingQuestionCard
						question={question.question}
						options={question.options}
						selectedOptionId={selections[currentStep] ?? null}
						pendingOtherId={isAwaitingOtherText ? otherOptionId : null}
						onSelect={handleSelect}
					/>

					{isAwaitingOtherText ? (
						<View
							style={{ borderCurve: 'continuous' }}
							className="gap-3 rounded-xl border border-white/20 bg-black/40 p-4"
						>
							<Input
								value={customAnswers[currentStep] ?? ''}
								onChangeText={(text) =>
									setCustomAnswers((prev) => ({ ...prev, [currentStep]: text }))
								}
								placeholder="Please specify your business type"
								placeholderTextColor="rgba(255, 255, 255, 0.8)"
								className="border-white/30 bg-white/10 text-white"
								returnKeyType="done"
								onSubmitEditing={handleOtherContinue}
								autoFocus
							/>
							<Pressable
								accessibilityRole="button"
								disabled={!customAnswers[currentStep]?.trim()}
								onPress={handleOtherContinue}
								style={{ borderCurve: 'continuous' }}
								className={cn(
									'min-h-12 items-center justify-center rounded-lg bg-white px-5 py-3',
									customAnswers[currentStep]?.trim() ? '' : 'opacity-50',
								)}
							>
								<Text className="font-sans-semibold text-base text-primary-dark">
									Continue
								</Text>
							</Pressable>
						</View>
					) : null}
				</View>

				<View className="flex-row items-center justify-between">
					{currentStep > 0 ? (
						<Pressable
							accessibilityRole="button"
							onPress={handleBack}
							className="min-h-10 justify-center px-2 py-2"
						>
							<Text className="font-sans-medium text-base text-white/80">← Back</Text>
						</Pressable>
					) : (
						<View className="h-10" />
					)}

					<Pressable
						accessibilityRole="button"
						disabled={completeOnboarding.isPending}
						onPress={() => void finish(selections, customAnswers)}
						className="min-h-10 justify-center px-2 py-2"
					>
						<Text className="font-sans-medium text-base text-white/60">Skip</Text>
					</Pressable>
				</View>
			</Screen>
		</FunnelGuard>
	)
}
