import type {
  SubscriptionPlan,
  SubscriptionStatus,
} from "./subscriptions.service.js";

export function isSubscriptionActive(
  status: null | SubscriptionStatus | undefined,
): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

export function hasVoiceAccess(
  plan: null | SubscriptionPlan | undefined,
): boolean {
  return plan === "AI_PRO" || plan === "LIFETIME";
}
