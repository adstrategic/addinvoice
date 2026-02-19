import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionsService,
  type BillingInterval,
  type SubscriptionPlan,
  type SubscriptionStatusResponse,
} from "@/features/subscriptions/service/subscriptions.service";

export interface CreateCheckoutParams {
  planType: SubscriptionPlan;
  billingInterval: BillingInterval;
}

/**
 * Query key factory for subscription queries
 */
export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => [...subscriptionKeys.all, "status"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
};

/**
 * Hook to fetch subscription status
 */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: () => subscriptionsService.getStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });
}

/**
 * Hook to fetch available subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => subscriptionsService.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
  });
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({ planType, billingInterval }: CreateCheckoutParams) =>
      subscriptionsService.createCheckout(planType, billingInterval),
    onSuccess: (url) => {
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    },
  });
}

/**
 * Hook to create customer portal session
 */
export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => subscriptionsService.createPortalSession(),
    onSuccess: (url) => {
      // Redirect to Stripe Customer Portal
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    },
  });
}
