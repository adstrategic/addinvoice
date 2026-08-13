import type {
	SubscriptionPlan,
	SubscriptionStatus,
} from '@/features/subscriptions/service/subscriptions.service'

export function hasVoiceAccess(plan: SubscriptionPlan | null): boolean {
	if (!plan) return false
	return ['FREE_TRIAL', 'MINIMUM', 'ESSENTIAL', 'LIFETIME'].includes(plan)
}

export function hasConversationalVoiceAccess(plan: SubscriptionPlan | null): boolean {
	if (!plan) return false
	return ['ESSENTIAL', 'LIFETIME'].includes(plan)
}

export function planAllowsAdvances(plan: SubscriptionPlan | null): boolean {
	if (!plan) return false
	return ['FREE_TRIAL', 'ESSENTIAL', 'LIFETIME'].includes(plan)
}

export function isSubscriptionActive(status: SubscriptionStatus | null): boolean {
	if (!status) return false
	return status === 'ACTIVE' || status === 'TRIALING'
}
