import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";

/**
 * Base URL for subscriptions API endpoints
 */
const BASE_URL = "/subscription";

export type PaidSubscriptionPlan = "MINIMUM" | "ESSENTIAL" | "LIFETIME";
export type SubscriptionPlan = PaidSubscriptionPlan | "FREE_TRIAL";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING";

export interface TrialModuleUsage {
  used: number;
  limit: number;
}

export interface TrialUsageSummary {
  invoices: TrialModuleUsage;
  estimates: TrialModuleUsage;
  proposals: TrialModuleUsage;
  expenses: TrialModuleUsage;
  advances: TrialModuleUsage;
  catalog: TrialModuleUsage;
  clients: TrialModuleUsage;
  payments: TrialModuleUsage;
  emails: TrialModuleUsage;
}

export interface VoiceUsageSummary {
  used: number;
  limit: number;
  windowEnd: string | null;
}

export interface SubscriptionStatusResponse {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  hasEverPaid: boolean;
  trialUsage?: TrialUsageSummary;
  voiceUsage?: VoiceUsageSummary;
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
  id: PaidSubscriptionPlan;
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

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create Stripe Checkout session
 */
async function createCheckout(
  planType: PaidSubscriptionPlan,
  priceId: string,
): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<CheckoutResponse>>(
      `${BASE_URL}/checkout`,
      { planType, priceId },
    );

    return data.data.url;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create Stripe Customer Portal session
 */
async function createPortalSession(returnUrl?: string): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<PortalResponse>>(
      `${BASE_URL}/portal`,
      returnUrl ? { returnUrl } : undefined,
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
 * Activate the free trial on the current workspace.
 */
async function activateTrial(): Promise<SubscriptionStatusResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<SubscriptionStatusResponse>
    >(`${BASE_URL}/trial/activate`);

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
  activateTrial,
};
