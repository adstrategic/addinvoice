import type { Prisma } from "@addinvoice/db";

import { EntityValidationError } from "../../errors/EntityErrors.js";

export async function resolveSelectedPaymentMethodId(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  selectedPaymentMethodId: null | number,
  options?: { useWorkspaceDefaultWhenNull?: boolean },
): Promise<null | number> {
  const useWorkspaceDefaultWhenNull =
    options?.useWorkspaceDefaultWhenNull ?? true;

  if (selectedPaymentMethodId != null) {
    return await validatePaymentMethod(
      tx,
      workspaceId,
      selectedPaymentMethodId,
    );
  }
  if (!useWorkspaceDefaultWhenNull) {
    return null;
  }

  const workspace = await tx.workspace.findUnique({
    select: { defaultPaymentMethodId: true },
    where: { id: workspaceId },
  });
  const defaultPaymentMethodId = workspace?.defaultPaymentMethodId ?? null;
  if (defaultPaymentMethodId == null) {
    return null;
  }

  try {
    return await validatePaymentMethod(tx, workspaceId, defaultPaymentMethodId);
  } catch {
    await tx.workspace.update({
      data: { defaultPaymentMethodId: null },
      where: { id: workspaceId },
    });
    return null;
  }
}

async function validatePaymentMethod(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  selectedPaymentMethodId: number,
): Promise<number> {
  const method = await tx.workspacePaymentMethod.findUnique({
    where: { id: selectedPaymentMethodId },
  });
  if (method?.workspaceId !== workspaceId) {
    throw new EntityValidationError("Selected payment method is invalid");
  }
  if (!method.isEnabled) {
    throw new EntityValidationError("Selected payment method must be enabled");
  }
  if (method.type === "VENMO") {
    throw new EntityValidationError(
      "Venmo is deprecated and cannot be selected for new documents",
    );
  }

  return method.id;
}
