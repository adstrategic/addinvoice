import axios, { type AxiosError, type AxiosInstance } from "axios";

// Global reference to getToken function
// This is set by the ClerkTokenProvider when the app loads
let getTokenFn: (() => Promise<string | null>) | null = null;

/**
 * Set the Clerk getToken function
 * Called by ClerkTokenProvider to make getToken available globally
 */
export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

/**
 * Base API client configured with backend URL and auth headers
 *
 * Token Refresh: Clerk automatically handles token refresh
 * - Tokens expire every ~60 seconds
 * - Clerk refreshes tokens ~10 seconds before expiration
 * - getToken() always returns a fresh, valid token
 * - No manual refresh logic needed!
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Request interceptor to add Clerk JWT token
  // Clerk automatically refreshes tokens, so we just call getToken() on each request
  client.interceptors.request.use(
    async (config) => {
      // Get Clerk token - Clerk handles refresh automatically
      const token = await getClerkToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: single place for redirects on auth/subscription errors.
  // Mutations and queries both get redirect here; handleMutationError only shows toasts.
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as
        | { code?: string; error?: string; redirectTo?: string }
        | undefined;
      const code = data?.code ?? data?.error;

      if (typeof window !== "undefined" && status !== undefined) {
        if (status === 401) {
          window.location.href = "/sign-in";
        } else if (status === 403 && code === "BUSINESS_REQUIRED") {
          window.location.href = data?.redirectTo ?? "/setup";
        } else if (status === 402 && code === "SUBSCRIPTION_REQUIRED") {
          window.location.href = data?.redirectTo ?? "/subscribe";
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

/**
 * Get Clerk JWT token
 * Clerk automatically handles token refresh - you don't need to worry about it!
 */
async function getClerkToken(): Promise<string | null> {
  if (!getTokenFn) {
    // If getToken is not set yet (app still loading), return null
    return null;
  }

  try {
    // Clerk's getToken() automatically:
    // 1. Checks if token is still valid
    // 2. Refreshes if needed (before expiration)
    // 3. Returns the fresh token
    return await getTokenFn();
  } catch (error) {
    console.error("Error getting Clerk token:", error);
    return null;
  }
}

export const apiClient = createApiClient();
