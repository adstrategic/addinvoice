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

export function useOnboardingStatus(options?: { enabled?: boolean }) {
  return useQuery<OnboardingStatus>({
    queryKey: onboardingKeys.status(),
    queryFn: () => onboardingService.getStatus(),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
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

export function useCompleteOnboardingTour() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void>({
    mutationFn: () => onboardingService.completeTour(),
    onSuccess: () => {
      // Patch cache in place — invalidating refetches and FunnelGuard unmounts the
      // dashboard tree (e.g. while the voice-invoice dialog is opening).
      queryClient.setQueryData<OnboardingStatus>(
        onboardingKeys.status(),
        (prev) =>
          prev
            ? {
                ...prev,
                onboardingTourCompletedAt: new Date().toISOString(),
              }
            : prev,
      );
    },
  });
}
