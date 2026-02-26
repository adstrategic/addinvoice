"use client";

import type { ApiErrorCode } from "@/lib/api/types";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "./handler";

function normalizeToApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return new ApiError(500, "INTERNAL_ERROR", message, err);
}

/**
 * Central dispatcher for mutation errors.
 * Toast + setError only; redirects are handled in apiClient response interceptor.
 *
 * @see ApiErrorCode in @/lib/api/types for known codes
 */
export function handleMutationError<T extends FieldValues>(
  err: unknown,
  setError?: UseFormSetError<T>,
): void {
  const apiError = normalizeToApiError(err);
  const code = apiError.code as ApiErrorCode;

  switch (code) {
    case "ERR_VALID":
    case "CONFLICT": {
      if (
        setError &&
        apiError.fields &&
        Object.keys(apiError.fields).length > 0
      ) {
        for (const [fieldPath, messages] of Object.entries(apiError.fields)) {
          setError(fieldPath as Path<T>, {
            type: "server",
            message: messages[0] ?? apiError.message,
          });
        }
        toast.error("Please fix the errors below", {
          description: apiError.message,
        });
      } else {
        toast.error(apiError.message);
      }
      break;
    }

    case "ERR_NF":
      toast.error(apiError.message);
      break;

    case "UNAUTHORIZED":
      toast.error("Your session expired. Please log in again.");
      // Redirect is handled in apiClient response interceptor
      break;

    case "BUSINESS_REQUIRED":
      toast.error(apiError.message ?? "You need to create a business first.");
      // Redirect is handled in apiClient response interceptor
      break;

    case "SUBSCRIPTION_REQUIRED":
      toast.error(apiError.message ?? "Active subscription required.");
      // Redirect is handled in apiClient response interceptor
      break;

    case "NETWORK_ERROR":
      toast.error(apiError.message);
      break;

    case "INTERNAL_ERROR":
    default:
      // Covers INTERNAL_ERROR and unknown/HTTP_xxx codes
      toast.error("Something went wrong. Please try again.");
      break;
  }
}
