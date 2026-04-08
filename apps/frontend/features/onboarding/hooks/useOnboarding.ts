import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  onboardingService,
  type CompleteOnboardingRequest,
  type OnboardingStatus,
} from "@/features/onboarding/service/onboarding.service";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  status: () => [...onboardingKeys.all, "status"] as const,
};

export function useOnboardingStatus() {
  return useQuery<OnboardingStatus>({
    queryKey: onboardingKeys.status(),
    queryFn: () => onboardingService.getStatus(),
    staleTime: 60 * 1000,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingStatus, unknown, CompleteOnboardingRequest>({
    mutationFn: (payload) => onboardingService.complete(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

