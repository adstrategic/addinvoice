/**
 * API Response Types
 * Shared types for all API responses across the application
 */

import z from "zod";

/**
 * Success response wrapper from API
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * Validation error response from zod-express-middleware
 * Includes field-specific validation issues
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  error: "Validation error" | "ZodError";
  details?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

/**
 * Pagination metadata
 */
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * Type guard to check if error is a validation error
 */
export function isValidationErrorResponse(
  error: ApiErrorResponse
): error is ValidationErrorResponse {
  return (
    error.error === "Validation error" ||
    error.error === "ZodError" ||
    "details" in error
  );
}
