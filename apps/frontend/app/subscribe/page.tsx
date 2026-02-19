"use client";

import { useState, useMemo } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useSubscriptionPlans,
  useCreateCheckout,
} from "@/hooks/use-subscription";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type {
  BillingInterval,
  PlanPricesLifetime,
  PlanPricesRecurring,
  SubscriptionPlan,
  SubscriptionPlanResponse,
} from "@/features/subscriptions/service/subscriptions.service";

function getDisplayPrice(
  plan: SubscriptionPlanResponse,
  billingInterval: BillingInterval,
) {
  if (plan.id === "LIFETIME") {
    return (plan.prices as PlanPricesLifetime).oneTime;
  }
  const key = billingInterval === "month" ? "monthly" : "yearly";
  return (plan.prices as PlanPricesRecurring)[key];
}

export default function SubscribePage() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const createCheckout = useCreateCheckout();
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );

  const yearlySavePercent = useMemo(() => {
    const recurring = plans?.find(
      (p) => p.id === "CORE" && "monthly" in p.prices && "yearly" in p.prices,
    );
    if (!recurring || !("monthly" in recurring.prices)) return null;
    const { monthly, yearly } = recurring.prices as PlanPricesRecurring;
    const fullYearMonthly = monthly.amount * 12;
    if (fullYearMonthly <= 0) return null;
    return Math.round(
      ((fullYearMonthly - yearly.amount) / fullYearMonthly) * 100,
    );
  }, [plans]);

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlan(planId);
    const priceInfo = getDisplayPrice(plan, billingInterval);
    try {
      await createCheckout.mutateAsync({
        planType: planId,
        priceId: priceInfo.priceId,
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      });
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
      <SubscriptionGuard redirectIfSubscribed>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-6xl px-4 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard redirectIfSubscribed>
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Select the plan that best fits your needs
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("month")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  billingInterval === "month"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("year")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  billingInterval === "year"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                {yearlySavePercent != null && (
                  <Badge variant="secondary" className="text-xs">
                    Save {yearlySavePercent}%
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isProcessing = createCheckout.isPending && isSelected;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.id === "AI_PRO"
                    ? "border-primary shadow-lg scale-105"
                    : ""
                }`}
              >
                {plan.id === "AI_PRO" && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    variant="default"
                  >
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {(() => {
                      const priceInfo = getDisplayPrice(plan, billingInterval);
                      return (
                        <>
                          <span className="text-4xl font-bold">
                            ${priceInfo.amount}
                          </span>
                          {plan.id === "LIFETIME" ? (
                            <span className="text-muted-foreground">
                              one-time
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              /{billingInterval === "month" ? "month" : "year"}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Full access to all features</span>
                    </li>
                    {plan.id === "CORE" && (
                      <>
                        <li className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span>$3 worth of AI credits included</span>
                        </li>
                      </>
                    )}
                    {plan.id === "AI_PRO" && (
                      <>
                        <li className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span>$8 worth of AI credits included</span>
                        </li>
                      </>
                    )}
                    {plan.id === "LIFETIME" && (
                      <>
                        <li className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span>One-time payment</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span>Free tier AI credits</span>
                        </li>
                      </>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.id === "AI_PRO" ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isProcessing || createCheckout.isPending}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}
