import type { Prisma } from "@addinvoice/db";
import type {
  CreateExpenseDTO,
  ExpenseStatsQuery,
  ListExpensesQuery,
  UpdateExpenseDTO,
} from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import type { ExpenseEntity } from "./expenses.schemas.js";

import {
  deleteReceiptByPublicId,
  extractPublicIdFromUrl,
  // uploadExpenseReceipt,
  // validateImageFile,
} from "../../core/cloudinary.js";
import {
  EntityNotFoundError,
  // EntityValidationError,
} from "../../errors/EntityErrors.js";
import { createMerchantInTx } from "../merchants/merchants.service.js";

/**
 * List all expenses for a workspace
 */
export async function listExpenses(
  workspaceId: number,
  query: ListExpensesQuery,
): Promise<{
  expenses: ExpenseEntity[];
  limit: number;
  page: number;
  total: number;
}> {
  const {
    merchantId,
    workCategoryId,
    dateFrom,
    dateTo,
    limit = 10,
    page = 1,
    search,
  } = query;
  const skip = (page - 1) * limit;

  const expenseDateFilter: Prisma.ExpenseWhereInput["expenseDate"] =
    dateFrom && dateTo
      ? { gte: new Date(dateFrom), lte: new Date(dateTo) }
      : dateFrom
        ? { gte: new Date(dateFrom) }
        : dateTo
          ? { lte: new Date(dateTo) }
          : undefined;

  const where: Prisma.ExpenseWhereInput = {
    workspaceId,
    ...(search && {
      OR: [
        { merchant: { name: { contains: search, mode: "insensitive" } } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(workCategoryId != null && { workCategoryId }),
    ...(expenseDateFilter && { expenseDate: expenseDateFilter }),
    ...(merchantId != null && { merchantId }),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      include: {
        merchant: true,
        workCategory: true,
      },
      orderBy: { sequence: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses: expenses.map((expense) => ({
      ...expense,
      total: Number(expense.total),
      tax: expense.tax ? Number(expense.tax) : null,
    })),
    limit,
    page,
    total,
  };
}

/**
 * Get the next sequence number for a workspace
 */
async function getNextSequence(
  tx: Prisma.TransactionClient,
  workspaceId: number,
): Promise<number> {
  const last = await tx.expense.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true },
    where: { workspaceId },
  });

  return last ? last.sequence + 1 : 1;
}

/**
 * Create a new expense.
 * Supports optional receipt file upload and inline merchant creation via merchantName.
 * On DB failure after uploading, deletes the uploaded image from Cloudinary (best-effort).
 */
export async function createExpense(
  workspaceId: number,
  data: CreateExpenseDTO,
): Promise<ExpenseEntity> {
  const imageUrl =
    data.image != null && data.image.trim() !== "" ? data.image.trim() : null;

  return await prisma.$transaction(async (tx) => {
    let merchantId: null | number = null;
    const rawMid = data.merchantId;
    if (rawMid != null && rawMid > 0) {
      merchantId = rawMid;
    } else if (rawMid === -1 && data.merchantName?.trim()) {
      const newMerchant = await createMerchantInTx(tx, workspaceId, {
        name: data.merchantName.trim(),
      });
      merchantId = newMerchant.id;
    }
    // else: merchantId stays null (0 = "None", or omitted)

    const sequence = await getNextSequence(tx, workspaceId);

    const expense = await tx.expense.create({
      data: {
        workCategoryId: data.workCategoryId ?? null,
        description: data.description ?? null,
        expenseDate: data.expenseDate,
        image: imageUrl,
        merchantId,
        sequence,
        tax: data.tax ?? null,
        total: data.total,
        workspaceId,
      },
      include: {
        merchant: true,
        workCategory: true,
      },
    });

    return {
      ...expense,
      tax: expense.tax ? Number(expense.tax) : null,
      total: Number(expense.total),
    };
  });
}

// TODO: change logic
/**
 * Update an existing expense.
 * When image is replaced, deletes the previous receipt from Cloudinary (best-effort; logs on failure).
 * Supports optional receipt file upload and inline merchant creation via merchantName.
 */
export async function updateExpense(
  workspaceId: number,
  id: number,
  data: UpdateExpenseDTO,
): Promise<ExpenseEntity> {
  const newImageUrl =
    data.image != null && data.image.trim() !== "" ? data.image.trim() : null;

  const { expense: result, oldImageUrl } = await prisma.$transaction(
    async (tx) => {
      const existing = await findById(tx, id);
      if (existing?.workspaceId !== workspaceId) {
        throw new EntityNotFoundError("Expense not found");
      }

      let merchantId = data.merchantId;
      if (data.merchantId === -1 && data.merchantName?.trim()) {
        const newMerchant = await createMerchantInTx(tx, workspaceId, {
          name: data.merchantName.trim(),
        });
        merchantId = newMerchant.id;
      }
      const resolvedMerchantId =
        merchantId === 0 || merchantId === null ? null : merchantId;

      const imageUrl = newImageUrl;
      const oldImageUrl =
        imageUrl != null &&
        existing.image != null &&
        existing.image !== imageUrl
          ? existing.image
          : null;

      const expense = await tx.expense.update({
        data: {
          ...(data.workCategoryId !== undefined && {
            workCategoryId: data.workCategoryId ?? null,
          }),
          ...(data.description !== undefined && {
            description: data.description ?? null,
          }),
          ...(data.expenseDate !== undefined && {
            expenseDate: data.expenseDate,
          }),
          ...(imageUrl && { image: imageUrl }),
          ...(resolvedMerchantId !== undefined && {
            merchantId: resolvedMerchantId ?? { set: null },
          }),
          ...(data.tax !== undefined && { tax: data.tax ?? null }),
          ...(data.total !== undefined && { total: data.total }),
        },
        where: {
          id,
          workspaceId,
        },
        include: {
          merchant: true,
          workCategory: true,
        },
      });

      return {
        expense: {
          ...expense,
          tax: expense.tax ? Number(expense.tax) : null,
          total: Number(expense.total),
        },
        oldImageUrl,
      };
    },
  );

  if (oldImageUrl != null && oldImageUrl !== "") {
    const publicId = extractPublicIdFromUrl(oldImageUrl);
    if (publicId) {
      try {
        await deleteReceiptByPublicId(publicId);
      } catch (error) {
        console.error(
          "Failed to delete previous receipt from Cloudinary:",
          error,
        );
      }
    }
  }

  return result;
}

/**
 * Delete an expense (hard delete).
 * Also deletes the receipt image from Cloudinary if present (best-effort; logs on failure).
 */
export async function deleteExpense(
  workspaceId: number,
  id: number,
): Promise<void> {
  const imageUrl = await prisma.$transaction(async (tx) => {
    const existing = await findById(tx, id);
    if (existing?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Expense not found");
    }
    const url = existing.image ?? null;
    await tx.expense.delete({
      where: { id },
    });
    return url;
  });

  if (imageUrl != null && imageUrl !== "") {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteReceiptByPublicId(publicId);
      } catch (error) {
        console.error("Failed to delete receipt from Cloudinary:", error);
      }
    }
  }
}

/**
 * Find an expense by ID within a workspace
 */
export async function findById(
  tx: Prisma.TransactionClient,
  id: number,
): Promise<ExpenseEntity | null> {
  const expense = await tx.expense.findUnique({
    where: { id },
    include: {
      merchant: true,
      workCategory: true,
    },
  });
  return expense
    ? {
        ...expense,
        total: Number(expense.total),
        tax: expense.tax ? Number(expense.tax) : null,
      }
    : null;
}

/**
 * Get an expense by sequence within a workspace
 */
export async function getExpenseBySequence(
  workspaceId: number,
  sequence: number,
): Promise<ExpenseEntity> {
  const expense = await prisma.expense.findUnique({
    include: {
      merchant: true,
      workCategory: true,
    },
    where: {
      workspaceId_sequence: {
        sequence,
        workspaceId,
      },
    },
  });

  if (!expense) {
    throw new EntityNotFoundError("Expense not found");
  }

  return {
    ...expense,
    tax: expense.tax ? Number(expense.tax) : null,
    total: Number(expense.total),
  };
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Get expense dashboard statistics for a workspace
 */
export async function getExpenseDashboardStats(
  workspaceId: number,
  query: ExpenseStatsQuery,
): Promise<{
  monthlyExpenses: { amount: number; month: string; }[];
  recentExpenses: ExpenseEntity[];
  thisMonthExpenses: number;
  thisWeekExpenses: number;
  totalAmount: number;
  totalExpenses: number;
}> {
  const { workCategoryId } = query;
  const where: Prisma.ExpenseWhereInput = {
    workspaceId,
    ...(workCategoryId != null && { workCategoryId }),
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [aggregate, thisWeekCount, thisMonthCount, allForMonthly, recent] =
    await Promise.all([
      prisma.expense.aggregate({
        _count: { id: true },
        _sum: { total: true },
        where,
      }),
      prisma.expense.count({
        where: {
          ...where,
          expenseDate: { gte: startOfWeek },
        },
      }),
      prisma.expense.count({
        where: {
          ...where,
          expenseDate: { gte: startOfMonth },
        },
      }),
      prisma.expense.findMany({
        select: { expenseDate: true, total: true },
        where: {
          ...where,
          expenseDate: {
            gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
            lte: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999,
            ),
          },
        },
      }),
      prisma.expense.findMany({
        include: { merchant: true, workCategory: true },
        orderBy: { expenseDate: "desc" },
        take: 5,
        where,
      }),
    ]);

  const totalExpenses = aggregate._count.id;
  const totalAmount = Number(aggregate._sum.total ?? 0);

  const monthlyExpenses: { amount: number; month: string; }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const amount = allForMonthly
      .filter((e) => {
        const d = new Date(e.expenseDate);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, e) => sum + Number(e.total), 0);
    monthlyExpenses.push({
      month: MONTH_NAMES[date.getMonth()] ?? "Unknown",
      amount,
    });
  }

  const recentExpenses = recent.map((expense) => ({
    ...expense,
    total: Number(expense.total),
    tax: expense.tax ? Number(expense.tax) : null,
  }));

  return {
    totalExpenses,
    totalAmount,
    thisWeekExpenses: thisWeekCount,
    thisMonthExpenses: thisMonthCount,
    monthlyExpenses,
    recentExpenses,
  };
}
