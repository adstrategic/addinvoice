"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";
import { setClerkTokenGetter } from "@/lib/api/client";

interface ClerkTokenProviderProps {
  children: ReactNode;
}

/**
 * Provider that makes Clerk's getToken function available to the API client
 * This allows axios interceptors to get fresh tokens automatically
 *
 * Clerk handles token refresh automatically:
 * - Tokens expire every ~60 seconds
 * - Clerk refreshes before expiration (~50 seconds)
 * - getToken() always returns a valid token
 */
export function ClerkTokenProvider({ children }: ClerkTokenProviderProps) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      // Set the getToken function in the API client
      // Now axios interceptors can call getToken() before each request
      setClerkTokenGetter(async () => {
        try {
          // Clerk automatically refreshes the token if needed
          return await getToken();
        } catch (error) {
          console.error("Error getting token:", error);
          return null;
        }
      });
    }
  }, [getToken, isLoaded]);

  return <>{children}</>;
}
