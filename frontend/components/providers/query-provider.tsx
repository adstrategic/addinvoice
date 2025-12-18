"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query provider with default configuration
 * Wraps the app to provide React Query functionality
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000, // 30 seconds
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            // Retry failed requests once
            retry: 1,
            // Refetch on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
