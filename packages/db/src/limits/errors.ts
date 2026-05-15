import type { SubscriptionPlan } from "../generated/prisma/enums.js";

import type { LimitModule } from "./policies.js";

export type LimitExceededCode =
  | "TRIAL_MODULE_LIMIT"
  | "TRIAL_EMAIL_LIMIT"
  | "VOICE_MONTHLY_LIMIT"
  | "ADVANCES_PLAN_REQUIRED"
  | "TRIAL_NOT_AVAILABLE";

export interface LimitExceededDetails {
  module?: LimitModule;
  limit?: number;
  used?: number;
  plan?: SubscriptionPlan | null;
  resetsAt?: Date;
}

// Cross-process error thrown by guard helpers. Shape matches the backend's
// CustomError contract (statusCode + code + message) so the global error
// handler can serialize it without a special path. The agent recognizes the
// class to convert it into a spoken ToolError.
export class LimitExceededError extends Error {
  statusCode: number;
  code: LimitExceededCode;
  details: LimitExceededDetails;

  constructor(
    code: LimitExceededCode,
    message: string,
    details: LimitExceededDetails = {},
  ) {
    super(message);
    this.name = "LimitExceededError";
    this.code = code;
    this.statusCode = code === "ADVANCES_PLAN_REQUIRED" ? 403 : 402;
    this.details = details;
  }
}
