/**
 * API Response Types
 * Shared types for all API responses across the application
 */

/**
 * Success response wrapper from API
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  success: false;
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

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type guard to check if response is a success response
 */
export function isApiSuccessResponse<T>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

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
