"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const { isLoading, isReady, hasQueryError, refetchAll } = useOnboardingFunnel({ requiredStep, enabled });

  if (isLoading) {
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

  if (hasQueryError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not verify your account</AlertTitle>
            <AlertDescription>
              Something went wrong loading your account status. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetchAll()} className="w-full">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isReady) {
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
