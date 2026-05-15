import type { SubscriptionPlan } from "../generated/prisma/enums.js";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

import { LimitExceededError } from "./errors.js";
import {
  counterColumnForModule,
  MINIMUM_VOICE_MONTHLY_LIMIT,
  MODULE_TRIAL_LIMIT,
  TRIAL_EMAIL_LIMIT,
  planAllowsAdvances,
  type LimitModule,
  type UsageCounterKey,
} from "./policies.js";

export type PrismaLike = PrismaClient | Prisma.TransactionClient;

interface PlanRow {
  subscriptionPlan: SubscriptionPlan | null;
  hasEverPaid: boolean;
}

async function getPlan(
  prisma: PrismaLike,
  workspaceId: number,
): Promise<PlanRow> {
  const row = await prisma.workspace.findUnique({
    select: { subscriptionPlan: true, hasEverPaid: true },
    where: { id: workspaceId },
  });
  if (!row) {
    throw new LimitExceededError(
      "TRIAL_NOT_AVAILABLE",
      "Workspace not found",
      {},
    );
  }
  return row;
}

// Atomically increments a counter if it is below the limit.
// Uses updateMany so the WHERE check and the SET happen in one SQL statement —
// Prisma translates this to `UPDATE ... SET col = col+1 WHERE col < limit`.
// Returns true when the increment succeeded, false when the limit was already reached.
async function tryIncrementCounter(
  prisma: PrismaLike,
  workspaceId: number,
  field: UsageCounterKey,
  limit: number,
): Promise<boolean> {
  const result = await prisma.workspaceUsage.updateMany({
    where: {
      workspaceId,
      [field]: { lt: limit },
    } as Prisma.WorkspaceUsageWhereInput,
    data: {
      [field]: { increment: 1 },
    } as Prisma.WorkspaceUsageUpdateManyMutationInput,
  });
  return result.count > 0;
}

// Rolls the MINIMUM voice usage window forward if it has expired. Idempotent —
// safe to call concurrently (a race only re-writes the same target values).
export async function rollVoiceWindowIfNeeded(
  prisma: PrismaLike,
  workspaceId: number,
): Promise<void> {
  const row = await prisma.workspaceUsage.findUnique({
    select: { voiceWindowEnd: true, voiceWindowStart: true },
    where: { workspaceId },
  });
  if (!row?.voiceWindowEnd || !row.voiceWindowStart) return;
  const now = new Date();
  if (row.voiceWindowEnd > now) return;

  let start = row.voiceWindowStart;
  let end = row.voiceWindowEnd;
  while (end <= now) {
    start = addOneMonth(start);
    end = addOneMonth(end);
  }

  await prisma.workspaceUsage.update({
    data: {
      voiceItemsCreated: 0,
      voiceWindowEnd: end,
      voiceWindowStart: start,
    },
    where: { workspaceId },
  });
}

interface AssertCanCreateOptions {
  viaVoice?: boolean;
}

// Increments the module counter (FREE_TRIAL) and the voice counter (MINIMUM,
// when viaVoice=true), both subject to their respective caps. ESSENTIAL and
// LIFETIME are unmetered.
export async function assertCanCreate(
  prisma: PrismaLike,
  workspaceId: number,
  module: LimitModule,
  options: AssertCanCreateOptions = {},
): Promise<void> {
  const { subscriptionPlan } = await getPlan(prisma, workspaceId);

  if (module === "advances" && !planAllowsAdvances(subscriptionPlan)) {
    throw new LimitExceededError(
      "ADVANCES_PLAN_REQUIRED",
      "The Advances module requires an Essential plan or higher",
      { module, plan: subscriptionPlan },
    );
  }

  if (subscriptionPlan === "FREE_TRIAL") {
    const field = counterColumnForModule(module);
    const ok = await tryIncrementCounter(
      prisma,
      workspaceId,
      field,
      MODULE_TRIAL_LIMIT,
    );
    if (!ok) {
      throw new LimitExceededError(
        "TRIAL_MODULE_LIMIT",
        `Free trial limit reached for ${module} (${MODULE_TRIAL_LIMIT} max). Upgrade to keep creating.`,
        {
          limit: MODULE_TRIAL_LIMIT,
          module,
          plan: subscriptionPlan,
          used: MODULE_TRIAL_LIMIT,
        },
      );
    }
    return;
  }

  if (subscriptionPlan === "MINIMUM" && options.viaVoice === true) {
    await rollVoiceWindowIfNeeded(prisma, workspaceId);
    const ok = await tryIncrementCounter(
      prisma,
      workspaceId,
      "voiceItemsCreated",
      MINIMUM_VOICE_MONTHLY_LIMIT,
    );
    if (!ok) {
      throw new LimitExceededError(
        "VOICE_MONTHLY_LIMIT",
        `Voice creation limit reached for this month (${MINIMUM_VOICE_MONTHLY_LIMIT} max). Upgrade to Essential for unlimited voice.`,
        {
          limit: MINIMUM_VOICE_MONTHLY_LIMIT,
          plan: subscriptionPlan,
          used: MINIMUM_VOICE_MONTHLY_LIMIT,
        },
      );
    }
  }
}

// Trial only: 4 total user-initiated emails across all modules.
export async function assertCanSendEmail(
  prisma: PrismaLike,
  workspaceId: number,
): Promise<void> {
  const { subscriptionPlan } = await getPlan(prisma, workspaceId);
  if (subscriptionPlan !== "FREE_TRIAL") return;

  const ok = await tryIncrementCounter(
    prisma,
    workspaceId,
    "emailsSent",
    TRIAL_EMAIL_LIMIT,
  );
  if (!ok) {
    throw new LimitExceededError(
      "TRIAL_EMAIL_LIMIT",
      `Free trial email limit reached (${TRIAL_EMAIL_LIMIT} max). Upgrade to keep sending.`,
      {
        limit: TRIAL_EMAIL_LIMIT,
        plan: subscriptionPlan,
        used: TRIAL_EMAIL_LIMIT,
      },
    );
  }
}

export async function assertCanClaimTrial(
  prisma: PrismaLike,
  workspaceId: number,
): Promise<void> {
  const row = await getPlan(prisma, workspaceId);
  if (row.hasEverPaid) {
    throw new LimitExceededError(
      "TRIAL_NOT_AVAILABLE",
      "This workspace has already used a paid plan and cannot start a free trial.",
      { plan: row.subscriptionPlan },
    );
  }
  if (row.subscriptionPlan === "FREE_TRIAL") {
    throw new LimitExceededError(
      "TRIAL_NOT_AVAILABLE",
      "This workspace is already on the free trial.",
      { plan: row.subscriptionPlan },
    );
  }
  if (row.subscriptionPlan != null) {
    throw new LimitExceededError(
      "TRIAL_NOT_AVAILABLE",
      "This workspace already has a subscription plan.",
      { plan: row.subscriptionPlan },
    );
  }
}

export async function ensureUsageRow(
  prisma: PrismaLike,
  workspaceId: number,
): Promise<void> {
  await prisma.workspaceUsage.upsert({
    create: { workspaceId },
    update: {},
    where: { workspaceId },
  });
}

function addOneMonth(d: Date): Date {
  const result = new Date(d);
  result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}
