import { AxiosError } from "axios";
import type {
  ApiErrorCode,
  UnifiedErrorResponse,
  ValidatorErrorItem,
} from "@/lib/api/types";
import { ZodError } from "zod";

/**
 * Normalised error class used across the frontend.
 * `code` matches the backend error codes (use ApiErrorCode for known codes).
 * `fields` carries per-field messages so the dispatcher can call setError.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ApiErrorCode | string,
    message: string,
    public details?: unknown,
    public fields?: Record<string, string[]>,
    public redirectTo?: string,
    /** Reserved; not used in UI for now */
    public readOnly?: boolean,
  ) {
    super(message);
    this.name = "ApiError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export function isValidatorErrorArray(
  data: unknown,
): data is ValidatorErrorItem[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "type" in item &&
        "errors" in item &&
        typeof (item as ValidatorErrorItem).errors === "object",
    )
  );
}

function parseValidatorErrorArrayToFields(
  data: ValidatorErrorItem[],
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const item of data) {
    const issues = item.errors?.issues ?? [];
    for (const issue of issues) {
      const path = issue.path.map(String).join(".");
      if (!path) continue;
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
  }
  return fields;
}

/**
 * Transform any error into a typed ApiError.
 * Handles: frontend ZodError, network errors, validator middleware array,
 * unified backend contract, and generic HTTP errors.
 */
export function handleApiError(error: unknown): never {
  // Frontend Zod parse failure (response didn't match expected schema)
  if (error instanceof ZodError) {
    throw new ApiError(
      500,
      "INTERNAL_ERROR",
      "Received invalid data from server",
      error.issues,
    );
  }

  // Network error or request timeout (no response at all)
  if (error instanceof AxiosError && !error.response) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Network error. Please check your connection and try again.",
      error.message,
    );
  }

  // HTTP error response
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;

    // Validator middleware (processRequest): 400 + array of { type, errors }
    if (status === 400 && data && isValidatorErrorArray(data)) {
      const fields = parseValidatorErrorArrayToFields(data);
      const firstMessage = Object.values(fields)[0]?.[0] ?? "Validation failed";
      throw new ApiError(400, "ERR_VALID", firstMessage, data, fields);
    }

    // Unified contract: { code, message, statusCode, fields?, redirectTo?, readOnly? }
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      "message" in data &&
      "statusCode" in data
    ) {
      const unified = data as UnifiedErrorResponse;
      throw new ApiError(
        unified.statusCode,
        unified.code,
        unified.message,
        data,
        unified.fields,
        unified.redirectTo,
        unified.readOnly, // kept for parity with backend; not used in UI yet
      );
    }

    // Generic HTTP error (unrecognised response shape)
    throw new ApiError(
      status,
      `HTTP_${status}`,
      `Request failed with status ${status}`,
      data,
    );
  }

  // Non-Axios error
  if (error instanceof Error) {
    throw new ApiError(500, "INTERNAL_ERROR", error.message, error);
  }

  throw new ApiError(
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    error,
  );
}

/**
 * Error for public (no-auth) API calls, e.g. 409 Conflict on estimate accept.
 * Used by publicApiClient so callers can branch on code === "CONFLICT".
 */
export class PublicEstimateError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "PublicEstimateError";
  }
}
