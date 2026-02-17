import prisma from "../../core/db";
import type { PaymentMethodType } from "../../generated/prisma/client";
import type {
  PaymentMethodResponse,
  UpsertPaymentMethodDto,
} from "./workspace.schemas";

/**
 * List all workspace payment methods (one row per type, created on first upsert)
 */
export async function listPaymentMethods(
  workspaceId: number,
): Promise<PaymentMethodResponse[]> {
  const rows = await prisma.workspacePaymentMethod.findMany({
    where: { workspaceId },
    orderBy: { type: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type as PaymentMethodType,
    handle: row.handle,
    isEnabled: row.isEnabled,
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
    where: {
      workspaceId_type: { workspaceId, type },
    },
    create: {
      workspaceId,
      type,
      handle: data.handle ?? null,
      isEnabled: data.isEnabled,
    },
    update: {
      ...(data.handle !== undefined && { handle: data.handle }),
      ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
    },
  });
  return {
    id: row.id,
    type: row.type as PaymentMethodType,
    handle: row.handle,
    isEnabled: row.isEnabled,
  };
}
