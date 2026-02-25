import type { PaymentMethodType } from "@addinvoice/db";

import { prisma } from "@addinvoice/db";

import type {
  PaymentMethodResponse,
  UpsertPaymentMethodDto,
} from "./workspace.schemas.js";

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
    type: row.type,
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
  const row = await prisma.workspacePaymentMethod.upsert({
    create: {
      handle: data.handle ?? null,
      isEnabled: data.isEnabled,
      type,
      workspaceId,
    },
    update: {
      ...(data.handle !== undefined && { handle: data.handle }),
      ...(data.isEnabled && { isEnabled: data.isEnabled }),
    },
    where: {
      workspaceId_type: { type, workspaceId },
    },
  });
  return {
    handle: row.handle,
    id: row.id,
    isEnabled: row.isEnabled,
    type: row.type,
  };
}
