import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";

const BASE_URL = "/workspace/onboarding";

export interface OnboardingStatus {
  completedAt: string | null;
  answers: Record<string, unknown> | null;
}

export interface CompleteOnboardingRequest {
  answers: Record<string, unknown>;
}

/**
 * Get current workspace onboarding status
 */
async function getOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const { data } =
      await apiClient.get<ApiSuccessResponse<OnboardingStatus>>(BASE_URL);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Complete onboarding for current workspace.
 * This is one-time – backend will reject if already completed.
 */
async function completeOnboarding(
  payload: CompleteOnboardingRequest,
): Promise<OnboardingStatus> {
  try {
    const { data } =
      await apiClient.post<ApiSuccessResponse<OnboardingStatus>>(
        BASE_URL,
        payload,
      );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

export const onboardingService = {
  getStatus: getOnboardingStatus,
  complete: completeOnboarding,
};

