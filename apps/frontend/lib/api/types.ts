import z from "zod";

export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Error codes from backend (EntityErrors / global handler) and frontend-only codes.
 * Used for typed switching in handleMutationError; generic HTTP errors use `HTTP_${status}`.
 */
export type ApiErrorCode =
  | "ERR_VALID"
  | "CONFLICT"
  | "ERR_NF"
  | "UNAUTHORIZED"
  | "BUSINESS_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

/**
 * Unified error contract from backend global error handler.
 * Every error is sent as `{ code, message, statusCode }` with optional `fields`, `redirectTo`.
 */
export interface UnifiedErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  fields?: Record<string, string[]>;
  redirectTo?: string;
  /** Reserved for future use (e.g. read-only mode); not used in UI yet */
  readOnly?: boolean;
}

/**
 * Validator middleware (processRequest / zod-express-middleware) sends
 * a 400 with an array body: `[{ type, errors: { issues } }]`.
 */
export type ValidatorErrorItem = {
  type: "Body" | "Params" | "Query";
  errors: { issues?: Array<{ path: (string | number)[]; message: string }> };
};

export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
