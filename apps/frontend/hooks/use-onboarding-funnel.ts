"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

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

  // Wait for Clerk to finish initializing before allowing any evaluation.
  // React runs child effects before parent effects, so React Query fires its
  // queries before ClerkTokenProvider's useEffect sets getTokenFn. Without this
  // guard the requests go out unauthenticated, fail, isLoading drops to false
  // with data:undefined, and the funnel redirects to /onboarding on every login.
  const { isLoaded: isAuthLoaded } = useAuth();

  // Only fetch once Clerk is ready so requests always carry a valid token.
  const {
    data: onboarding,
    isLoading: isLoadingOnboarding,
    isError: isErrorOnboarding,
    refetch: refetchOnboarding,
  } = useOnboardingStatus({ enabled: isAuthLoaded });
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
    refetch: refetchSubscription,
  } = useSubscription();
  const {
    hasBusiness,
    isLoading: isLoadingBusiness,
    isError: isErrorBusiness,
    refetch: refetchBusiness,
  } = useHasBusiness();

  const isLoading =
    !isAuthLoaded ||          // block until Clerk has initialized
    isLoadingOnboarding ||
    isLoadingSubscription ||
    isLoadingBusiness;

  const hasQueryError = isErrorOnboarding || isErrorSubscription || isErrorBusiness;

  const refetchAll = () =>
    Promise.all([refetchOnboarding(), refetchSubscription(), refetchBusiness()]);

  const actualStep = resolveFunnelStep({
    onboardingCompleted: Boolean(onboarding?.completedAt),
    subscriptionActive: Boolean(subscription?.isActive),
    hasBusiness,
  });

  const redirectPath = getFunnelRedirectPath(actualStep, requiredStep);

  useEffect(() => {
    if (!enabled || isLoading || hasQueryError || !redirectPath) return;
    router.replace(redirectPath);
  }, [enabled, isLoading, hasQueryError, redirectPath, router]);

  return {
    actualStep,
    redirectPath,
    isLoading,
    hasQueryError,
    refetchAll,
    isReady: !isLoading && !redirectPath,
  };
}
