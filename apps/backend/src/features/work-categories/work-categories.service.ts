import type { Prisma } from "@addinvoice/db";
import type {
  CreateWorkCategoryDTO,
  ListWorkCategoriesQuery,
} from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import type { WorkCategoryEntity } from "./work-categories.schemas.js";

import { DEFAULT_WORK_CATEGORIES } from "./default-work-categories.js";

/**
 * List work categories for a workspace: global (workspaceId null) + workspace-specific custom.
 * Global categories first, then custom, with search and pagination.
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

  const [global, custom] = await Promise.all([
    prisma.workCategory.findMany({
      where: { workspaceId: null },
      orderBy: { sequence: "asc" },
    }),
    prisma.workCategory.findMany({
      where: { workspaceId },
      orderBy: { sequence: "asc" },
    }),
  ]);

  let all = [...global, ...custom];
  if (search) {
    const lower = search.toLowerCase();
    all = all.filter((c) => c.name.toLowerCase().includes(lower));
  }
  const total = all.length;
  const categories = all.slice(skip, skip + limit);

  return {
    categories,
    limit,
    page,
    total,
  };
}

/**
 * Create a new workspace-specific work category (custom category).
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
        icon: data.icon ?? null,
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

/**
 * Ensure global default work categories exist (idempotent).
 * Inserts once; no per-workspace duplication.
 */
export async function ensureGlobalWorkCategories(): Promise<void> {
  const count = await prisma.workCategory.count({
    where: { workspaceId: null },
  });
  if (count > 0) return;

  await prisma.workCategory.createMany({
    data: DEFAULT_WORK_CATEGORIES.map((c, i) => ({
      workspaceId: null,
      name: c.name,
      icon: c.icon,
      sequence: i + 1,
    })),
  });
}
