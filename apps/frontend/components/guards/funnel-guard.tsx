"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingFunnel } from "@/hooks/use-onboarding-funnel";
import type { FunnelStep } from "@/lib/funnel";

interface FunnelGuardProps {
  children: React.ReactNode;
  requiredStep: FunnelStep;
  /** When false, skips redirect logic (e.g. while setup submit is in flight) */
  enabled?: boolean;
}

/**
 * Redirects users to the earliest incomplete funnel step when they are not on the required step.
 */
export function FunnelGuard({
  children,
  requiredStep,
  enabled = true,
}: FunnelGuardProps) {
  const { isLoading, isReady } = useOnboardingFunnel({ requiredStep, enabled });

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
