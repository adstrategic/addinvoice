"use client";

import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  /** When true, redirects to / if subscription is active (used on /subscribe page) */
  redirectIfSubscribed?: boolean;
}

/**
 * Subscription Guard Component
 * Redirects users without active subscription to /subscribe.
 * With redirectIfSubscribed, redirects users with active subscription to /.
 */
export function SubscriptionGuard({
  children,
  redirectIfSubscribed = false,
}: SubscriptionGuardProps) {
  const { data: subscription, isLoading, error, refetch, isError } = useSubscription();

  useEffect(() => {
    if (isLoading || !subscription) return;

    if (redirectIfSubscribed) {
      if (subscription.isActive && typeof window !== "undefined") {
        window.location.href = "/";
      }
      return;
    }

    if (!subscription.isActive && typeof window !== "undefined") {
      window.location.href = "/subscribe";
    }
  }, [subscription, isLoading, redirectIfSubscribed]);

  // Show loading skeleton while checking subscription
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

  // Error state: show retry instead of silently staying
  if (isError && error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not verify subscription</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong. Please try again."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="w-full">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // redirectIfSubscribed: show redirecting when subscription is active
  if (redirectIfSubscribed && subscription?.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Default guard: no subscription, show redirecting to /subscribe
  if (!redirectIfSubscribed && subscription && !subscription.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Redirecting to subscription page...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
