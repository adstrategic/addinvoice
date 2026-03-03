import type { Prisma } from "@addinvoice/db";
import type {
  CreateWorkCategoryDTO,
  ListWorkCategoriesQuery,
} from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import type { WorkCategoryEntity } from "./work-categories.schemas.js";

/**
 * List work categories for a workspace with search and pagination
 */
export async function listWorkCategories(
  workspaceId: number,
  query: ListWorkCategoriesQuery,
): Promise<{
  categories: WorkCategoryEntity[];
  limit: number;
  page: number;
  total: number;
}> {
  const { search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.WorkCategoryWhereInput = {
    workspaceId,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };

  const [categories, total] = await Promise.all([
    prisma.workCategory.findMany({
      orderBy: { sequence: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.workCategory.count({ where }),
  ]);

  return {
    categories,
    limit,
    page,
    total,
  };
}

/**
 * Create a new work category
 */
export async function createWorkCategory(
  workspaceId: number,
  data: CreateWorkCategoryDTO,
): Promise<WorkCategoryEntity> {
  return await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(tx, workspaceId);
    const category = await tx.workCategory.create({
      data: {
        name: data.name,
        sequence,
        workspaceId,
      },
    });
    return category;
  });
}

async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const last = await tx.workCategory.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true },
    where: { workspaceId },
  });
  return last ? last.sequence + 1 : 1;
}
