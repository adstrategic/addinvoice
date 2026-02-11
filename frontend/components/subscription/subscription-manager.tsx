"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, useCreatePortalSession } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";

export function SubscriptionManager() {
  const { data: subscription, isLoading } = useSubscription();
  const createPortalSession = useCreatePortalSession();

  const handleManageSubscription = async () => {
    try {
      await createPortalSession.mutateAsync();
    } catch (error) {
      console.error("Failed to create portal session:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !subscription.isActive) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your subscription and billing
            </CardDescription>
          </div>
          <Badge variant={subscription.isActive ? "default" : "secondary"}>
            {subscription.plan || "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Next billing date:{" "}
              {format(new Date(subscription.currentPeriodEnd), "PPP")}
            </span>
          </div>
        )}
        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your subscription will be cancelled at the end of the current billing period.
            </p>
          </div>
        )}
        <Button
          onClick={handleManageSubscription}
          disabled={createPortalSession.isPending}
          className="w-full"
          variant="outline"
        >
          {createPortalSession.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Manage Subscription"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
