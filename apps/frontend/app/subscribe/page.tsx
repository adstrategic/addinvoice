"use client";

import { useState, useMemo } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
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
  useActivateTrial,
  useCreateCheckout,
  useSubscription,
  useSubscriptionPlans,
} from "@/hooks/use-subscription";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  BillingInterval,
  PaidSubscriptionPlan,
  PlanPricesLifetime,
  PlanPricesRecurring,
  SubscriptionPlanResponse,
} from "@/features/subscriptions/service/subscriptions.service";
import { toast } from "sonner";

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
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const activateTrial = useActivateTrial();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [selectedPlan, setSelectedPlan] =
    useState<PaidSubscriptionPlan | null>(null);

  const canStartTrial =
    subscription != null &&
    subscription.plan == null &&
    subscription.hasEverPaid === false;

  const yearlySavePercent = useMemo(() => {
    const recurring = plans?.find(
      (p) =>
        p.id === "MINIMUM" && "monthly" in p.prices && "yearly" in p.prices,
    );
    if (!recurring || !("monthly" in recurring.prices)) return null;
    const { monthly, yearly } = recurring.prices as PlanPricesRecurring;
    const fullYearMonthly = monthly.amount * 12;
    if (fullYearMonthly <= 0) return null;
    return Math.round(
      ((fullYearMonthly - yearly.amount) / fullYearMonthly) * 100,
    );
  }, [plans]);

  const handleSelectPlan = async (planId: PaidSubscriptionPlan) => {
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
      toast.error("Failed to create checkout session", {
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the checkout session",
      });
      setSelectedPlan(null);
    }
  };

  const handleStartTrial = async () => {
    try {
      await activateTrial.mutateAsync();
      toast.success("Free trial activated!");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error: unknown) {
      toast.error("Could not start free trial", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact support",
      });
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
                    plan.id === "ESSENTIAL"
                      ? "border-primary shadow-lg scale-105"
                      : ""
                  }`}
                >
                  {plan.id === "ESSENTIAL" && (
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
                        const priceInfo = getDisplayPrice(
                          plan,
                          billingInterval,
                        );
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
                                /
                                {billingInterval === "month" ? "month" : "year"}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.id === "MINIMUM" && (
                        <>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>
                              Manage invoices, estimates, expenses & clients
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Voice creation (25 sessions/month)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Dashboard & reports</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>PDF generation & email delivery</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Payment tracking</span>
                          </li>
                        </>
                      )}
                      {plan.id === "ESSENTIAL" && (
                        <>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Everything in Minimum</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Unlimited voice sessions</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>AI bookkeeper conversational assistant</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Advances module</span>
                          </li>
                        </>
                      )}
                      {plan.id === "LIFETIME" && (
                        <>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>Everything in Essential</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span>One-time payment, lifetime access</span>
                          </li>
                        </>
                      )}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.id === "ESSENTIAL" ? "default" : "outline"}
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

          {canStartTrial && (
            <div className="mt-8">
              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Not ready to commit? Try AddInvoice free
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Explore every module — including voice creation and the
                    Advances module — without entering payment details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 md:grid-cols-2 mb-6 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>4 items per module (cumulative — no resets)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>4 emails total across all modules</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Voice creation enabled (counts toward module caps)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>One-time activation — upgrade anytime</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full sm:w-auto"
                    variant="secondary"
                    onClick={handleStartTrial}
                    disabled={activateTrial.isPending}
                  >
                    {activateTrial.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Activating trial...
                      </>
                    ) : (
                      "Start Free Trial"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}
