import type { SubscriptionPlan, SubscriptionStatus } from "../service/subscriptions.service";

export function hasVoiceAccess(plan: SubscriptionPlan | null | undefined): boolean {
	return plan === "MINIMUM" || plan === "ESSENTIAL" || plan === "LIFETIME";
}

export function isSubscriptionActive(
	status: SubscriptionStatus | null | undefined,
): boolean {
	return status === "ACTIVE" || status === "TRIALING";
}
