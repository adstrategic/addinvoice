import type { SubscriptionPlan, SubscriptionStatus } from "../service/subscriptions.service";

// Voice creation tools (floating mic in modules) — all active plans
export function hasVoiceAccess(plan: SubscriptionPlan | null | undefined): boolean {
	return (
		plan === "FREE_TRIAL" ||
		plan === "MINIMUM" ||
		plan === "ESSENTIAL" ||
		plan === "LIFETIME"
	);
}

// Conversational AI bookkeeper at /voice — Essential and Lifetime only
export function hasConversationalVoiceAccess(plan: SubscriptionPlan | null | undefined): boolean {
	return plan === "ESSENTIAL" || plan === "LIFETIME";
}

export function planAllowsAdvances(plan: SubscriptionPlan | null | undefined): boolean {
	return plan === "FREE_TRIAL" || plan === "ESSENTIAL" || plan === "LIFETIME";
}

export function isSubscriptionActive(
	status: SubscriptionStatus | null | undefined,
): boolean {
	return status === "ACTIVE" || status === "TRIALING";
}
