import z from 'zod'

export interface ApiSuccessResponse<T> {
	data: T
}

/**
 * Error codes from backend (EntityErrors / global handler) and client-only codes.
 * Used for typed switching in handleMutationError; generic HTTP errors use `HTTP_${status}`.
 */
export type ApiErrorCode =
	| 'ERR_VALID'
	| 'CONFLICT'
	| 'ERR_NF'
	| 'UNAUTHORIZED'
	| 'BUSINESS_REQUIRED'
	| 'SUBSCRIPTION_REQUIRED'
	| 'INTERNAL_ERROR'
	| 'NETWORK_ERROR'
	| 'TRIAL_MODULE_LIMIT'
	| 'TRIAL_EMAIL_LIMIT'
	| 'VOICE_MONTHLY_LIMIT'
	| 'ADVANCES_PLAN_REQUIRED'
	| 'TRIAL_NOT_AVAILABLE'

/**
 * Unified error contract from the backend global error handler.
 * Every error is sent as `{ code, message, statusCode }` with optional
 * `fields`, `redirectTo`, `readOnly`.
 */
export interface UnifiedErrorResponse {
	code: string
	message: string
	statusCode: number
	fields?: Record<string, string[]>
	redirectTo?: string
	/** Set on 402 for read-only (GET) access — must NOT trigger a redirect. */
	readOnly?: boolean
}

/**
 * Validator middleware (processRequest / zod-express-middleware) sends
 * a 400 with an array body: `[{ type, errors: { issues } }]`.
 */
export type ValidatorErrorItem = {
	type: 'Body' | 'Params' | 'Query'
	errors: { issues?: Array<{ path: (string | number)[]; message: string }> }
}

export const paginationMetaSchema = z.object({
	total: z.number(),
	page: z.number(),
	limit: z.number(),
	totalPages: z.number(),
})

export type PaginationMeta = z.infer<typeof paginationMetaSchema>
