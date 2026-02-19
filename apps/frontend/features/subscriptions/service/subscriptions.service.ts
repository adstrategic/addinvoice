import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";

/**
 * Base URL for subscriptions API endpoints
 */
const BASE_URL = "/subscription";

export type SubscriptionPlan = "CORE" | "AI_PRO" | "LIFETIME";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING";

export interface SubscriptionStatusResponse {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export type BillingInterval = "month" | "year";

export interface PlanPriceInfo {
  priceId: string;
  amount: number;
  currency: string;
}

export interface PlanPricesRecurring {
  monthly: PlanPriceInfo;
  yearly: PlanPriceInfo;
}

export interface PlanPricesLifetime {
  oneTime: PlanPriceInfo;
}

export type PlanPrices = PlanPricesRecurring | PlanPricesLifetime;

export interface SubscriptionPlanResponse {
  id: SubscriptionPlan;
  name: string;
  description: string;
  prices: PlanPrices;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

/**
 * Get current subscription status
 */
async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<SubscriptionStatusResponse>
    >(`${BASE_URL}/status`);

    return {
      ...data.data,
      currentPeriodEnd: data.data.currentPeriodEnd
        ? new Date(data.data.currentPeriodEnd)
        : null,
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create Stripe Checkout session
 */
async function createCheckout(
  planType: SubscriptionPlan,
  billingInterval: BillingInterval,
): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<CheckoutResponse>>(
      `${BASE_URL}/checkout`,
      { planType, billingInterval },
    );

    return data.data.url;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create Stripe Customer Portal session
 */
async function createPortalSession(): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<PortalResponse>>(
      `${BASE_URL}/portal`,
    );

    return data.data.url;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get available subscription plans
 */
async function getPlans(): Promise<SubscriptionPlanResponse[]> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<SubscriptionPlanResponse[]>
    >(`${BASE_URL}/plans`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Service object for subscriptions
 */
export const subscriptionsService = {
  getStatus: getSubscriptionStatus,
  createCheckout,
  createPortalSession,
  getPlans,
};
