export type FunnelStep = "onboarding" | "subscribe" | "setup" | "dashboard";

export type FunnelState = {
  onboardingCompleted: boolean;
  subscriptionActive: boolean;
  hasBusiness: boolean;
};

export const FUNNEL_PATHS: Record<FunnelStep, string> = {
  onboarding: "/onboarding",
  subscribe: "/subscribe",
  setup: "/setup",
  dashboard: "/",
};

const STEP_ORDER: FunnelStep[] = [
  "onboarding",
  "subscribe",
  "setup",
  "dashboard",
];

export function resolveFunnelStep(state: FunnelState): FunnelStep {
  if (!state.onboardingCompleted) return "onboarding";
  if (!state.subscriptionActive) return "subscribe";
  if (!state.hasBusiness) return "setup";
  return "dashboard";
}

export function getFunnelRedirectPath(
  actualStep: FunnelStep,
  pageStep: FunnelStep,
): string | null {
  if (actualStep === pageStep) return null;
  return FUNNEL_PATHS[actualStep];
}

export function getFunnelStepIndex(step: FunnelStep): number {
  return STEP_ORDER.indexOf(step);
}
