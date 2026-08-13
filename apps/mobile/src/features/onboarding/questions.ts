export type OnboardingOption = {
	id: string
	text: string
	isOther?: boolean
}

export type OnboardingQuestion = {
	question: string
	options: OnboardingOption[]
}

/**
 * Copied verbatim from apps/frontend/app/onboarding/page.tsx, including the
 * curly apostrophes and en dash. The stored answers are a Json blob shared with
 * the web, so any wording drift would split analytics across two variants of the
 * same question.
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
	{
		question: 'How much time do invoices and admin tasks take away from your real work?',
		options: [
			{ id: 'A', text: 'Less than 30 minutes a week' },
			{ id: 'B', text: '1–3 hours per week' },
			{ id: 'C', text: 'Several hours every week' },
			{ id: 'D', text: 'It feels endless / I hate doing it' },
		],
	},
	{
		question: 'How are you currently managing invoices, clients, and payments?',
		options: [
			{ id: 'A', text: 'Spreadsheets or manual documents' },
			{ id: 'B', text: 'Multiple tools that don’t connect well' },
			{ id: 'C', text: 'An invoicing app that feels complicated' },
			{ id: 'D', text: 'I’m just starting / I don’t have a system' },
		],
	},
	{
		question: 'How would you like AddInvoices to help you the most?',
		options: [
			{ id: 'A', text: 'Save time with faster invoicing' },
			{ id: 'B', text: 'Automate reminders, payments, and tracking' },
			{ id: 'C', text: 'Manage everything by voice' },
			{ id: 'D', text: 'All of the above' },
		],
	},
	{
		question: 'What is your business about?',
		options: [
			{ id: 'A', text: 'Construction' },
			{ id: 'B', text: 'Contractor' },
			{ id: 'C', text: 'Cleaning services' },
			{ id: 'D', text: 'Other', isOther: true },
		],
	},
]

/** Builds the exact `answers` blob the web sends, so both clients store one shape. */
export function buildOnboardingAnswers(
	selections: Record<number, string>,
	customAnswers: Record<number, string>,
) {
	return {
		version: 1,
		submittedAt: new Date().toISOString(),
		questions: ONBOARDING_QUESTIONS.map((q, index) => {
			const selectedOptionId = selections[index] ?? null
			const selectedOption =
				selectedOptionId == null
					? null
					: (q.options.find((o) => o.id === selectedOptionId) ?? null)
			const customText = customAnswers[index]?.trim() || null

			return {
				index,
				question: q.question,
				selectedOptionId,
				selectedOptionText:
					selectedOption?.isOther && customText ? customText : (selectedOption?.text ?? null),
				...(customText ? { customText } : {}),
			}
		}),
	}
}
