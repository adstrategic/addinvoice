"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CreditCard } from "lucide-react";
import { useUser } from "@clerk/nextjs";

// Customer portal link
const customerPortalLink =
  "https://billing.stripe.com/p/login/00w9AVeG9154g35cFq3ZK00";

export function SubscriptionManager() {
  const { data: subscription, isLoading } = useSubscription();
  console.log("subscription", subscription);

  const { user, isLoaded, isSignedIn } = useUser();

  // Redirect unauthenticated users to /subscribe
  if (!isSignedIn) {
    window.location.href = "/subscribe";
    return null;
  }

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
        <Button disabled={!isLoaded} className="w-full" variant="outline">
          <a
            href={
              customerPortalLink +
              "?prefilled_email=" +
              user.primaryEmailAddress?.emailAddress
            }
            target="_blank"
          >
            {isLoaded ? (
              "Manage Subscription"
            ) : (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            )}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
