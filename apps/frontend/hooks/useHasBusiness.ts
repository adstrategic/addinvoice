import { useBusinesses } from "@/features/businesses";

/**
 * Hook to check if the user has at least one business
 * Useful for redirecting to setup page if no business exists
 */
export function useHasBusiness() {
  const { data, isLoading } = useBusinesses();

  return {
    hasBusiness: (data?.data?.length ?? 0) > 0,
    isLoading,
    businesses: data?.data ?? [],
  };
}
