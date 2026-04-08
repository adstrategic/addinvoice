import {
  type AgentLanguage,
  type PaymentMethodType,
  type Prisma,
  prisma,
} from "@addinvoice/db";

import type {
  PaymentMethodResponse,
  UpsertOnboardingDto,
  UpsertPaymentMethodDto,
  UpsertWorkspaceLanguageDto,
} from "./workspace.schemas.js";

import { encrypt } from "../../core/encryption.js";
import { EntityValidationError } from "../../errors/EntityErrors.js";
import {
  createPerWorkspaceStripeClient,
  deregisterWebhook,
  validateAndRegisterWebhook,
} from "../stripe/stripe-integration.service.js";
import Stripe from "stripe";

/**
 * List all workspace payment methods (one row per type, created on first upsert)
 */
export async function listPaymentMethods(
  workspaceId: number,
): Promise<PaymentMethodResponse[]> {
  const rows = await prisma.workspacePaymentMethod.findMany({
    orderBy: { type: "asc" },
    where: { workspaceId },
  });
  return rows.map((row) => ({
    handle: row.handle,
    id: row.id,
    isEnabled: row.isEnabled,
    stripeConnected: !!row.stripeSecretKey,
    type: row.type as PaymentMethodResponse["type"],
  }));
}

/**
 * Upsert a workspace payment method by type (create or update on @@unique([workspaceId, type]))
 */
export async function upsertPaymentMethod(
  workspaceId: number,
  type: PaymentMethodType,
  data: UpsertPaymentMethodDto,
): Promise<PaymentMethodResponse> {
  // Stripe-specific flow: validate key + auto-register webhook
  if (type === "STRIPE") {
    return upsertStripePaymentMethod(workspaceId, data);
  }

  const row = await prisma.workspacePaymentMethod.upsert({
    create: {
      handle: data.handle ?? null,
      isEnabled: data.isEnabled,
      type,
      workspaceId,
    },
    update: {
      ...(data.handle !== undefined && { handle: data.handle }),
      isEnabled: data.isEnabled,
    },
    where: {
      workspaceId_type: { type, workspaceId },
    },
  });
  return {
    handle: row.handle,
    id: row.id,
    isEnabled: row.isEnabled,
    stripeConnected: false,
    type: row.type as PaymentMethodResponse["type"],
  };
}

async function upsertStripePaymentMethod(
  workspaceId: number,
  data: UpsertPaymentMethodDto,
): Promise<PaymentMethodResponse> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("APP_BASE_URL environment variable is not set");

  // If disabling Stripe, deregister webhook and clear credentials
  if (!data.isEnabled) {
    const existing = await prisma.workspacePaymentMethod.findFirst({
      where: { workspaceId, type: "STRIPE" },
    });

    if (existing?.stripeWebhookId && existing.stripeSecretKey) {
      try {
        const stripeClient = createPerWorkspaceStripeClient(existing.stripeSecretKey);
        await deregisterWebhook(stripeClient, existing.stripeWebhookId);
      } catch {
        // Best-effort — continue even if deregistration fails
      }
    }

    const row = await prisma.workspacePaymentMethod.upsert({
      create: { isEnabled: false, type: "STRIPE", workspaceId },
      update: {
        isEnabled: false,
        stripeSecretKey: null,
        stripeWebhookId: null,
        stripeWebhookSecret: null,
      },
      where: { workspaceId_type: { type: "STRIPE", workspaceId } },
    });
    return {
      handle: row.handle,
      id: row.id,
      isEnabled: row.isEnabled,
      stripeConnected: false,
      type: "STRIPE",
    };
  }

  // Enabling / updating Stripe — a secret key is required
  if (!data.stripeSecretKey) {
    throw new EntityValidationError("Stripe secret key is required to enable Stripe payments");
  }

  // Validate key and auto-register webhook
  let webhookId: string | null = null;
  let webhookSecret: string | null = null;

  try {
    const result = await validateAndRegisterWebhook(
      data.stripeSecretKey,
      workspaceId,
      appBaseUrl,
    );
    webhookId = result.webhookId;
    webhookSecret = result.webhookSecret;
  } catch (err) {
    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      throw new EntityValidationError(
        "Invalid Stripe key — please verify it in your Stripe dashboard",
      );
    }
    throw err;
  }

  const encryptedKey = encrypt(data.stripeSecretKey);
  const encryptedSecret = webhookSecret ? encrypt(webhookSecret) : null;

  const row = await prisma.workspacePaymentMethod.upsert({
    create: {
      isEnabled: true,
      stripeSecretKey: encryptedKey,
      stripeWebhookId: webhookId,
      stripeWebhookSecret: encryptedSecret,
      type: "STRIPE",
      workspaceId,
    },
    update: {
      isEnabled: true,
      stripeSecretKey: encryptedKey,
      stripeWebhookId: webhookId,
      stripeWebhookSecret: encryptedSecret,
    },
    where: { workspaceId_type: { type: "STRIPE", workspaceId } },
  });

  return {
    handle: row.handle,
    id: row.id,
    isEnabled: row.isEnabled,
    stripeConnected: true,
    stripeWebhookPending: !webhookSecret,
    type: "STRIPE",
  };
}

/**
 * Get workspace onboarding status and (optionally) answers
 */
export async function getOnboarding(
  workspaceId: number,
): Promise<{ answers: unknown; completedAt: Date | null }> {
  const workspace = await prisma.workspace.findUnique({
    select: {
      onboardingCompletedAt: true,
      onboardingAnswers: true,
    },
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return {
    completedAt: workspace.onboardingCompletedAt ?? null,
    answers: workspace.onboardingAnswers ?? null,
  };
}

/**
 * Set onboarding answers and completion time.
 * This is one-time: if already completed, throws.
 */
export async function completeOnboarding(
  workspaceId: number,
  data: UpsertOnboardingDto,
): Promise<{ answers: unknown; completedAt: Date | null }> {
  const existing = await prisma.workspace.findUnique({
    select: {
      onboardingCompletedAt: true,
    },
    where: { id: workspaceId },
  });

  if (!existing) {
    throw new Error("Workspace not found");
  }

  if (existing.onboardingCompletedAt) {
    throw new Error("Onboarding already completed");
  }

  const updated = await prisma.workspace.update({
    data: {
      onboardingAnswers: data.answers as Prisma.InputJsonValue,
      onboardingCompletedAt: new Date(),
    },
    select: {
      onboardingCompletedAt: true,
      onboardingAnswers: true,
    },
    where: { id: workspaceId },
  });

  return {
    completedAt: updated.onboardingCompletedAt ?? null,
    answers: updated.onboardingAnswers,
  };
}

/**
 * Get the user's preferred language for the voice agent
 */
export async function getWorkspaceLanguage(
  workspaceId: number,
): Promise<{ language: AgentLanguage }> {
  const workspace = await prisma.workspace.findUnique({
    select: { language: true },
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return { language: workspace.language };
}

/**
 * Update the user's preferred language for the voice agent
 */
export async function updateWorkspaceLanguage(
  workspaceId: number,
  data: UpsertWorkspaceLanguageDto,
): Promise<{ language: AgentLanguage }> {
  const updated = await prisma.workspace.update({
    select: { language: true },
    data: { language: data.language as AgentLanguage },
    where: { id: workspaceId },
  });

  return { language: updated.language };
}
