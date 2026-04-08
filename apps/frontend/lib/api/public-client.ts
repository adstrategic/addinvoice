import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { UnifiedErrorResponse } from "@/lib/api/types";
import { ApiError, PublicEstimateError } from "@/lib/errors/handler";

/**
 * Axios instance for public (no-auth) API calls.
 * Same base URL as apiClient; no Authorization header.
 * Response interceptor turns 409 into PublicEstimateError and other errors into ApiError (no redirects).
 */
function createPublicApiClient(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as
        | { code?: string; message?: string; statusCode?: number }
        | undefined;

      if (status === 409) {
        const message =
          data?.message ?? "This estimate has already been accepted";
        return Promise.reject(
          new PublicEstimateError(409, "CONFLICT", message),
        );
      }

      if (
        data &&
        typeof data === "object" &&
        "code" in data &&
        "message" in data &&
        "statusCode" in data
      ) {
        const unified = data as UnifiedErrorResponse;
        return Promise.reject(
          new ApiError(
            unified.statusCode,
            unified.code,
            unified.message,
            data,
            unified.fields,
            undefined, // no redirect for public client
            unified.readOnly,
          ),
        );
      }

      if (typeof status === "number") {
        return Promise.reject(
          new ApiError(
            status,
            `HTTP_${status}`,
            `Request failed with status ${status}`,
            data,
          ),
        );
      }

      if (!error.response) {
        return Promise.reject(
          new ApiError(
            0,
            "NETWORK_ERROR",
            "Network error. Please check your connection and try again.",
            error.message,
          ),
        );
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const publicApiClient = createPublicApiClient();
