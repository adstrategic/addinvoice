import { AxiosError } from "axios";
import type {
  ApiErrorResponse,
  ValidationErrorResponse,
} from "@/lib/api/types";

/**
 * Custom API Error class
 * Extends Error with additional context for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Transform Axios error to typed ApiError
 * Handles all error scenarios: network, validation, HTTP errors
 */
export function handleApiError(error: unknown): never {
  // Network error or request timeout
  if (error instanceof AxiosError && !error.response) {
    throw new ApiError(
      0,
      "NetworkError",
      "Network error. Please check your connection and try again.",
      error.message
    );
  }

  // HTTP error response
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;

    // Handle validation errors (400 with details)
    if (
      status === 400 &&
      data &&
      typeof data === "object" &&
      "success" in data &&
      !data.success &&
      ("details" in data ||
        data.error === "Validation error" ||
        data.error === "ZodError")
    ) {
      const errorData = data as ValidationErrorResponse;
      throw new ApiError(
        status,
        "ZodError",
        errorData.message || "Validation failed",
        errorData.details || []
      );
    }

    // Handle other API errors
    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      !data.success
    ) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        status,
        errorData.error || "ApiError",
        errorData.message || "An error occurred",
        data
      );
    }

    // Generic HTTP error
    throw new ApiError(
      status,
      `HTTP_${status}`,
      `Request failed with status ${status}`,
      data
    );
  }

  // Unknown error
  if (error instanceof Error) {
    throw new ApiError(500, "UnknownError", error.message, error);
  }

  // Fallback
  throw new ApiError(
    500,
    "UnknownError",
    "An unexpected error occurred",
    error
  );
}
