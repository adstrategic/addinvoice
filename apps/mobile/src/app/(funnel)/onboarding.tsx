import { router } from 'expo-router'
import { useState } from 'react'

import { FunnelGuard } from '@/components/guards/funnel-guard'
import { OnboardingQuestionCard } from '@/components/onboarding/onboarding-question'
import { Button, Input, Screen, Text, View } from '@/components/ui'
import { useCompleteOnboarding } from '@/features/onboarding/hooks/use-onboarding'
import { buildOnboardingAnswers, ONBOARDING_QUESTIONS } from '@/features/onboarding/questions'

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

	if (isFinishing) {
		return (
			<Screen center>
				<Text variant="heading">You&apos;re exactly where you need to be.</Text>
				<Text variant="muted">Setting up your workspace…</Text>
			</Screen>
		)
	}

	if (!question) return null

	return (
		// enabled:false while finishing keeps the guard from redirecting mid-animation.
		<FunnelGuard requiredStep="onboarding" enabled={!isFinishing}>
			<Screen avoidKeyboard>
				<Text variant="muted" className="text-sm">
					Question {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
				</Text>

				<OnboardingQuestionCard
					question={question.question}
					options={question.options}
					selectedOptionId={selections[currentStep] ?? null}
					onSelect={handleSelect}
				/>

				{isAwaitingOtherText ? (
					<View className="gap-3">
						<Input
							label="Please specify your business type"
							value={customAnswers[currentStep] ?? ''}
							onChangeText={(text) =>
								setCustomAnswers((prev) => ({ ...prev, [currentStep]: text }))
							}
							placeholder="e.g. Landscaping"
							autoFocus
						/>
						<Button
							label="Continue"
							disabled={!customAnswers[currentStep]?.trim()}
							onPress={handleOtherContinue}
						/>
					</View>
				) : null}

				<Button
					label="Skip"
					variant="ghost"
					onPress={() => void finish(selections, customAnswers)}
				/>
			</Screen>
		</FunnelGuard>
	)
}
