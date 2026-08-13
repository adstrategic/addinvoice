import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { ReactNode } from 'react'
import { useState } from 'react'

/** Mirrors apps/frontend/components/providers/query-provider.tsx. */
export function QueryProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30 * 1000,
						gcTime: 5 * 60 * 1000,
						retry: (failureCount, error) => {
							const status = (error as AxiosError)?.response?.status
							// Retrying these can only produce the same answer.
							if (status === 429 || status === 401 || status === 403) return false
							return failureCount < 1
						},
						refetchOnMount: true,
					},
					mutations: { retry: 1 },
				},
			}),
	)

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
