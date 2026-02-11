"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  allowReadOnly?: boolean;
}

/**
 * Subscription Guard Component
 * Redirects users without active subscription to /subscribe
 * Allows read-only access if allowReadOnly is true
 */
export function SubscriptionGuard({
  children,
  allowReadOnly = false,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const { data: subscription, isLoading, error } = useSubscription();

  useEffect(() => {
    // Only redirect when we have data (not loading) and subscription is not active
    if (!isLoading && subscription && !subscription.isActive) {
      // Use window.location.href for more reliable redirect
      // router.push might fail if the router isn't ready yet (e.g., during Clerk auth flow)
      if (typeof window !== "undefined") {
        window.location.href = "/subscribe";
      }
    }
  }, [subscription, isLoading, error, router]);

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

  // If there was an error fetching subscription, redirect to subscribe page
  if (error) {
    console.error("SubscriptionGuard: Error fetching subscription", error);

    // Use window.location.href for more reliable redirect
    if (typeof window !== "undefined") {
      window.location.href = "/subscribe";
    }

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

  // If we have data and subscription is not active, show redirecting message
  // The useEffect above will handle the actual redirect
  if (subscription && !subscription.isActive) {
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

  // Has active subscription, render children
  return <>{children}</>;
}
