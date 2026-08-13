import { useBusinesses } from '@/features/businesses/hooks/use-businesses'

export function useHasBusiness(options?: { enabled?: boolean }) {
	const { data, isLoading, isError, refetch } = useBusinesses(undefined, options)

	return {
		hasBusiness: (data?.data?.length ?? 0) > 0,
		businesses: data?.data ?? [],
		isLoading,
		isError,
		refetch,
	}
}
