import type { Prisma } from "@addinvoice/db";
import type {
  CreateMerchantInput,
  ListMerchantsQuery,
} from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import type { MerchantEntity } from "./merchants.schemas.js";

/**
 * List all merchants for a workspace
 */
export async function listMerchants(
  workspaceId: number,
  query: ListMerchantsQuery,
): Promise<{
  limit: number;
  merchants: MerchantEntity[];
  page: number;
  total: number;
}> {
  const { search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MerchantWhereInput = {
    workspaceId,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };

  const [merchants, total] = await Promise.all([
    prisma.merchant.findMany({
      orderBy: { sequence: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.merchant.count({ where }),
  ]);

  return {
    merchants,
    limit,
    page,
    total,
  };
}

/**
 * Create a new merchant within an existing transaction (e.g. expense create flow).
 */
export async function createMerchantInTx(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  data: CreateMerchantInput,
): Promise<MerchantEntity> {
  const sequence = await getNextSequence(tx, workspaceId);
  return tx.merchant.create({
    data: {
      name: data.name,
      sequence,
      workspaceId,
    },
  });
}

/**
 * Create a new merchant
 */
export async function createMerchant(
  workspaceId: number,
  data: CreateMerchantInput,
): Promise<MerchantEntity> {
  return await prisma.$transaction(async (tx) =>
    createMerchantInTx(tx, workspaceId, data),
  );
}

async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const last = await tx.merchant.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true },
    where: { workspaceId },
  });
  return last ? last.sequence + 1 : 1;
}
