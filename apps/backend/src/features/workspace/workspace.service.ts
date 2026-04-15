import {
  type AgentLanguage,
  type PaymentMethodType,
  type Prisma,
  prisma,
} from "@addinvoice/db";
import Stripe from "stripe";

import type {
  PaymentMethodResponse,
  SetDefaultPaymentMethodDto,
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

const ACCOUNT_IDENTIFIER_REGEX = /^[A-Za-z0-9@._\-\s]+$/;

/**
 * List all workspace payment methods (one row per type, created on first upsert)
 */
export async function listPaymentMethods(
  workspaceId: number,
): Promise<PaymentMethodResponse[]> {
  const [rows, workspace] = await Promise.all([
    prisma.workspacePaymentMethod.findMany({
      orderBy: { type: "asc" },
      where: { workspaceId },
    }),
    prisma.workspace.findUnique({
      select: { defaultPaymentMethodId: true },
      where: { id: workspaceId },
    }),
  ]);
  const defaultPaymentMethodId = workspace?.defaultPaymentMethodId ?? null;
  return rows.map((row) => ({
    handle: row.handle,
    id: row.id,
    isDefault: row.id === defaultPaymentMethodId,
    isEnabled: row.isEnabled,
    stripeConnected: !!row.stripeSecretKey,
    type: row.type as PaymentMethodResponse["type"],
  }));
}

export async function setDefaultPaymentMethod(
  workspaceId: number,
  paymentMethodId: SetDefaultPaymentMethodDto["paymentMethodId"],
): Promise<{ defaultPaymentMethodId: null | number }> {
  if (paymentMethodId == null) {
    await prisma.workspace.update({
      data: { defaultPaymentMethodId: null },
      where: { id: workspaceId },
    });
    return { defaultPaymentMethodId: null };
  }

  await validateDefaultPaymentMethodSelection(workspaceId, paymentMethodId);
  const updated = await prisma.workspace.update({
    data: { defaultPaymentMethodId: paymentMethodId },
    select: { defaultPaymentMethodId: true },
    where: { id: workspaceId },
  });
  return { defaultPaymentMethodId: updated.defaultPaymentMethodId };
}

/**
 * Upsert a workspace payment method by type (create or update on @@unique([workspaceId, type]))
 */
export async function upsertPaymentMethod(
  workspaceId: number,
  type: PaymentMethodType,
  data: UpsertPaymentMethodDto,
): Promise<PaymentMethodResponse> {
  if (type === "VENMO") {
    throw new EntityValidationError("Venmo can't be used right now");
  }

  // Stripe-specific flow: validate key + auto-register webhook
  if (type === "STRIPE") {
    return upsertStripePaymentMethod(workspaceId, data);
  }

  validateManualPaymentMethodData(data);
  const normalizedHandle = data.handle?.trim() ?? null;

  const row = await prisma.workspacePaymentMethod.upsert({
    create: {
      handle: normalizedHandle,
      isEnabled: data.isEnabled,
      type,
      workspaceId,
    },
    update: {
      ...(data.handle !== undefined && { handle: normalizedHandle }),
      isEnabled: data.isEnabled,
    },
    where: {
      workspaceId_type: { type, workspaceId },
    },
  });
  if (!row.isEnabled) {
    await clearDefaultPaymentMethodIfMatches(workspaceId, row.id);
  }

  return {
    handle: row.handle,
    id: row.id,
    isDefault: false,
    isEnabled: row.isEnabled,
    stripeConnected: false,
    type: row.type as PaymentMethodResponse["type"],
  };
}

function validateManualPaymentMethodData(data: UpsertPaymentMethodDto): void {
  const normalizedHandle = data.handle?.trim();
  const hasHandle = Boolean(normalizedHandle);

  if (data.isEnabled && !hasHandle) {
    throw new EntityValidationError(
      "Account identifier is required when enabling this payment method",
    );
  }

  if (
    hasHandle &&
    normalizedHandle &&
    !ACCOUNT_IDENTIFIER_REGEX.test(normalizedHandle)
  ) {
    throw new EntityValidationError(
      "Account identifier must be alphanumeric and can include spaces or @._-",
    );
  }
}

async function upsertStripePaymentMethod(
  workspaceId: number,
  data: UpsertPaymentMethodDto,
): Promise<PaymentMethodResponse> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl)
    throw new Error("APP_BASE_URL environment variable is not set");

  // If disabling Stripe, deregister webhook and clear credentials
  if (!data.isEnabled) {
    const existing = await prisma.workspacePaymentMethod.findFirst({
      where: { workspaceId, type: "STRIPE" },
    });

    if (existing?.stripeWebhookId && existing.stripeSecretKey) {
      try {
        const stripeClient = createPerWorkspaceStripeClient(
          existing.stripeSecretKey,
        );
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
    await clearDefaultPaymentMethodIfMatches(workspaceId, row.id);
    return {
      handle: row.handle,
      id: row.id,
      isDefault: false,
      isEnabled: row.isEnabled,
      stripeConnected: false,
      type: "STRIPE",
    };
  }

  // Enabling / updating Stripe — a secret key is required
  if (!data.stripeSecretKey) {
    throw new EntityValidationError(
      "Stripe secret key is required to enable Stripe payments",
    );
  }

  // Validate key and auto-register webhook
  let webhookId: null | string = null;
  let webhookSecret: null | string = null;

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
    isDefault: false,
    isEnabled: row.isEnabled,
    stripeConnected: true,
    stripeWebhookPending: !webhookSecret,
    type: "STRIPE",
  };
}

async function validateDefaultPaymentMethodSelection(
  workspaceId: number,
  paymentMethodId: number,
): Promise<void> {
  const method = await prisma.workspacePaymentMethod.findUnique({
    where: { id: paymentMethodId },
  });
  if (method?.workspaceId !== workspaceId) {
    throw new EntityValidationError("Selected payment method is invalid");
  }
  if (!method.isEnabled) {
    throw new EntityValidationError("Selected payment method must be enabled");
  }
  if (method.type === "VENMO") {
    throw new EntityValidationError(
      "Venmo is deprecated and cannot be selected as default",
    );
  }
}

async function clearDefaultPaymentMethodIfMatches(
  workspaceId: number,
  paymentMethodId: number,
): Promise<void> {
  await prisma.workspace.updateMany({
    data: { defaultPaymentMethodId: null },
    where: { defaultPaymentMethodId: paymentMethodId, id: workspaceId },
  });
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
