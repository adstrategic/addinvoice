"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import Link from "next/link";

function SubscribeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: subscription, isLoading, refetch } = useSubscription();

  useEffect(() => {
    // Refetch subscription status after successful payment
    if (sessionId) {
      // Wait a moment for webhook to process, then refetch
      const timer = setTimeout(() => {
        refetch();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [sessionId, refetch]);

  // Redirect to dashboard if subscription is active
  useEffect(() => {
    if (subscription?.isActive) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [subscription, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {subscription?.isActive ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription is now active. Redirecting to dashboard...
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {subscription?.isActive ? (
            <Button asChild className="w-full">
              <Link href="/">Go to Dashboard</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              This may take a few moments. If you don't see a confirmation soon,
              please contact support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscribeSuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Processing Payment</CardTitle>
          <CardDescription>
            Please wait while we confirm your payment...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<SubscribeSuccessFallback />}>
      <SubscribeSuccessContent />
    </Suspense>
  );
}
