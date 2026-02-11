"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@/features/subscriptions/service/subscriptions.service";

export default function SubscribePage() {
  const { data: plans, isLoading, isError } = useSubscriptionPlans();

  const createCheckout = useCreateCheckout();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
    try {
      await createCheckout.mutateAsync(planId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create checkout session",
      });
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select the plan that best fits your needs
          </p>
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
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.interval && (
                      <span className="text-muted-foreground">
                        /{plan.interval}
                      </span>
                    )}
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
  );
}
