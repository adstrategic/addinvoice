import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  onboardingService,
  type CompleteOnboardingRequest,
  type OnboardingStatus,
} from "@/features/onboarding/service/onboarding.service";
import { ApiError } from "@/lib/errors/handler";

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
    onSuccess: (data) => {
      // Patch cache directly instead of invalidating + background-refetching.
      // invalidateQueries starts an async refetch; the FunnelGuard reads the
      // stale completedAt:null during that window and immediately redirects back
      // to /onboarding — even though the DB already has the record saved.
      // Same pattern as useCompleteOnboardingTour.
      queryClient.setQueryData<OnboardingStatus>(onboardingKeys.status(), (prev) => ({
        completedAt: data.completedAt,
        answers: data.answers,
        // Preserve any existing tour completion timestamp
        onboardingTourCompletedAt: prev?.onboardingTourCompletedAt ?? null,
      }));
    },
    onError: (error) => {
      // If the backend says onboarding is already completed (409 Conflict), it
      // means the cache is stale but the DB record is fine. Patch the cache now
      // so the FunnelGuard sees onboardingCompleted:true and stops the loop.
      // onError fires before mutateAsync rejects, so by the time the catch block
      // in the page does router.push('/subscribe'), the cache is already correct.
      if (error instanceof ApiError && error.statusCode === 409) {
        queryClient.setQueryData<OnboardingStatus>(
          onboardingKeys.status(),
          (prev) =>
            prev?.completedAt
              ? prev // already has a real date — don't overwrite
              : {
                  completedAt: new Date().toISOString(),
                  answers: prev?.answers ?? null,
                  onboardingTourCompletedAt: prev?.onboardingTourCompletedAt ?? null,
                },
        );
      }
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
