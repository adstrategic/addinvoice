import type { ErrorCode } from "./types.js";

import CustomError from "./CustomError.js";

/**
 * Payload for field-level validation errors.
 * Keys are dot-notation field paths (e.g. "email", "invoiceNumber", "items.0.quantity").
 */
export type FieldValidationErrorPayload = Record<string, string[]>;

/**
 * Business required error (403)
 * Thrown when the workspace has no business; frontend may redirect to setup.
 * Pass optional redirectTo so the global handler includes it in the response.
 */
export class BusinessRequiredError extends CustomError<ErrorCode> {
  redirectTo?: string;

  constructor(
    message = "You need to create a business before accessing this feature",
    redirectTo?: string,
  ) {
    super({ code: "BUSINESS_REQUIRED", message, statusCode: 403 });
    this.name = "BusinessRequiredError";
    this.redirectTo = redirectTo;
  }
}

/**
 * Conflict error (409)
 * Thrown when a duplicate or conflict occurs (e.g. unique constraint).
 */
export class ConflictError extends CustomError<ErrorCode> {
  constructor(message = "A record with this value already exists") {
    super({ code: "CONFLICT", message, statusCode: 409 });
    this.name = "ConflictError";
  }
}

/**
 * Gone error (410)
 * Thrown when a resource is no longer available (e.g. link expired or already used).
 */
export class GoneError extends CustomError<ErrorCode> {
  constructor(message = "This link has expired or is no longer valid") {
    super({ code: "GONE", message, statusCode: 410 });
    this.name = "GoneError";
  }
}

/**
 * Entity not found error (404)
 * Thrown when an entity cannot be found by ID or sequence.
 * Pass only the message; code and statusCode are defaulted.
 */
export class EntityNotFoundError extends CustomError<ErrorCode> {
  constructor(message: string) {
    super({ code: "ERR_NF", message, statusCode: 404 });
    this.name = "EntityNotFoundError";
  }
}

/**
 * Entity validation error (400)
 * Thrown when client data validation or business rules fail.
 * Pass only the message; code and statusCode are defaulted.
 */
export class EntityValidationError extends CustomError<ErrorCode> {
  constructor(message: string) {
    super({ code: "ERR_VALID", message, statusCode: 400 });
    this.name = "EntityValidationError";
  }
}

/**
 * Validation error with field path(s) and message(s).
 * Use when a business rule fails for a specific form field so the frontend can show the error on that field.
 * Follows the same contract as other errors; frontend handles via the same VALIDATION_ERROR / ERR_VALID + fields path.
 */
export class FieldValidationError extends CustomError<ErrorCode> {
  fields?: FieldValidationErrorPayload;

  constructor(options: {
    code?: ErrorCode;
    fields?: FieldValidationErrorPayload;
    message: string;
    statusCode: number;
  }) {
    super({
      code: options.code ?? "ERR_VALID",
      message: options.message,
      statusCode: options.statusCode,
    });
    this.name = "FieldValidationError";
    this.fields = options.fields;
  }
}

/**
 * Internal server error (500)
 * Thrown when an unexpected failure occurs (e.g. in middleware catch).
 * Pass only the message; code and statusCode are defaulted.
 * The global error handler will send the JSON response.
 */
export class InternalError extends CustomError<ErrorCode> {
  constructor(message = "Internal server error") {
    super({ code: "INTERNAL_ERROR", message, statusCode: 500 });
    this.name = "InternalError";
  }
}

/**
 * Subscription required error (402)
 * Thrown when the workspace has no active subscription.
 * Pass optional readOnly and/or redirectTo so the global handler includes them in the response.
 */
export class SubscriptionRequiredError extends CustomError<ErrorCode> {
  readOnly?: boolean;
  redirectTo?: string;

  constructor(
    message: string,
    options?: { readOnly?: boolean; redirectTo?: string },
  ) {
    super({ code: "SUBSCRIPTION_REQUIRED", message, statusCode: 402 });
    this.name = "SubscriptionRequiredError";
    this.readOnly = options?.readOnly;
    this.redirectTo = options?.redirectTo;
  }
}

/**
 * Unauthorized error (401)
 * Thrown when the user is not authenticated (e.g. no userId).
 */
export class UnauthorizedError extends CustomError<ErrorCode> {
  constructor(message = "Unauthorized") {
    super({ code: "UNAUTHORIZED", message, statusCode: 401 });
    this.name = "UnauthorizedError";
  }
}
