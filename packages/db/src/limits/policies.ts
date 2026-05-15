import type { SubscriptionPlan } from "../generated/prisma/enums.js";

export const MODULE_TRIAL_LIMIT = 4;
export const TRIAL_EMAIL_LIMIT = 4;
export const MINIMUM_VOICE_MONTHLY_LIMIT = 25;

export type LimitModule =
  | "invoices"
  | "estimates"
  | "proposals"
  | "expenses"
  | "advances"
  | "catalog"
  | "clients"
  | "payments";

const ADVANCES_ALLOWED: ReadonlySet<SubscriptionPlan> = new Set([
  "FREE_TRIAL",
  "ESSENTIAL",
  "LIFETIME",
]);

const VOICE_ALLOWED: ReadonlySet<SubscriptionPlan> = new Set([
  "FREE_TRIAL",
  "MINIMUM",
  "ESSENTIAL",
  "LIFETIME",
]);

export function planAllowsAdvances(
  plan: null | SubscriptionPlan | undefined,
): boolean {
  return plan != null && ADVANCES_ALLOWED.has(plan);
}

export function planAllowsVoice(
  plan: null | SubscriptionPlan | undefined,
): boolean {
  return plan != null && VOICE_ALLOWED.has(plan);
}

export type UsageCounterKey =
  | "invoicesCreated"
  | "estimatesCreated"
  | "proposalsCreated"
  | "expensesCreated"
  | "advancesCreated"
  | "catalogCreated"
  | "clientsCreated"
  | "paymentsCreated"
  | "emailsSent"
  | "voiceItemsCreated";

const COUNTER_COLUMN: Record<LimitModule, UsageCounterKey> = {
  invoices: "invoicesCreated",
  estimates: "estimatesCreated",
  proposals: "proposalsCreated",
  expenses: "expensesCreated",
  advances: "advancesCreated",
  catalog: "catalogCreated",
  clients: "clientsCreated",
  payments: "paymentsCreated",
};

export function counterColumnForModule(module: LimitModule): UsageCounterKey {
  return COUNTER_COLUMN[module];
}
