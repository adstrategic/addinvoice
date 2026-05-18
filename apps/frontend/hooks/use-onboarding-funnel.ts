"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useOnboardingStatus } from "@/features/onboarding/hooks/useOnboarding";
import { useHasBusiness } from "@/hooks/useHasBusiness";
import { useSubscription } from "@/hooks/use-subscription";
import {
  getFunnelRedirectPath,
  resolveFunnelStep,
  type FunnelStep,
} from "@/lib/funnel";

type UseOnboardingFunnelOptions = {
  /** The funnel step this page or layout expects the user to be on */
  requiredStep: FunnelStep;
  /** When false, skips redirect logic (e.g. while finishing onboarding animation) */
  enabled?: boolean;
};

export function useOnboardingFunnel({
  requiredStep,
  enabled = true,
}: UseOnboardingFunnelOptions) {
  const router = useRouter();
  const {
    data: onboarding,
    isLoading: isLoadingOnboarding,
    isFetching: isFetchingOnboarding,
  } = useOnboardingStatus();
  const { data: subscription, isLoading: isLoadingSubscription } =
    useSubscription();
  const { hasBusiness, isLoading: isLoadingBusiness } = useHasBusiness();

  const isLoading =
    isLoadingOnboarding ||
    isFetchingOnboarding ||
    isLoadingSubscription ||
    isLoadingBusiness;

  const actualStep = resolveFunnelStep({
    onboardingCompleted: Boolean(onboarding?.completedAt),
    subscriptionActive: Boolean(subscription?.isActive),
    hasBusiness,
  });

  const redirectPath = getFunnelRedirectPath(actualStep, requiredStep);

  useEffect(() => {
    if (!enabled || isLoading || !redirectPath) return;
    router.replace(redirectPath);
  }, [enabled, isLoading, redirectPath, router]);

  return {
    actualStep,
    redirectPath,
    isLoading,
    isReady: !isLoading && !redirectPath,
  };
}
