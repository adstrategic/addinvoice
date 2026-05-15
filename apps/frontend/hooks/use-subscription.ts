import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  subscriptionsService,
  type PaidSubscriptionPlan,
} from "@/features/subscriptions/service/subscriptions.service";

export interface CreateCheckoutParams {
  planType: PaidSubscriptionPlan;
  priceId: string;
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

export interface UseSubscriptionPlansOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch available subscription plans
 */
export function useSubscriptionPlans(options?: UseSubscriptionPlansOptions) {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => subscriptionsService.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes - plans don't change often
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({ planType, priceId }: CreateCheckoutParams) =>
      subscriptionsService.createCheckout(planType, priceId),
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
    mutationFn: (returnUrl?: string) =>
      subscriptionsService.createPortalSession(returnUrl),
    onSuccess: (url) => {
      // Redirect to Stripe Customer Portal
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    },
  });
}

/**
 * Hook to activate the free trial on the current workspace.
 */
export function useActivateTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionsService.activateTrial(),
    onSuccess: (status) => {
      queryClient.setQueryData(subscriptionKeys.status(), status);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    },
  });
}
