import type { ErrorCode } from "./types.js";

import CustomError from "./CustomError.js";

/**
 * Entity not found error (404)
 * Thrown when an entity cannot be found by ID or sequence
 */
export class EntityNotFoundError extends CustomError<ErrorCode> {}

/**
 * Entity validation error (400)
 * Thrown when client data validation fails
 */
export class EntityValidationError extends CustomError<ErrorCode> {}
