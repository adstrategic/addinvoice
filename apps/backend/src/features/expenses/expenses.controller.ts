import type {
  createExpenseSchema,
  listExpensesSchema,
  updateExpenseSchema,
} from "@addinvoice/schemas";
import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { expenseStatsSchema } from "@addinvoice/schemas";

import type {
  getExpenseByIdSchema,
  getExpenseBySequenceSchema,
} from "./expenses.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import {
  uploadExpenseReceipt,
  validateImageFile,
} from "../../core/cloudinary.js";
import { InternalError } from "../../errors/EntityErrors.js";
import * as expensesService from "./expenses.service.js";
import { scanReceiptImage } from "./scan-receipt.service.js";

/**
 * POST /expenses/scan-receipt - Extract total, tax, date, merchant from receipt image via Claude Vision
 */
export async function scanReceipt(
  req: TypedRequest<never, never, never>,
  res: Response,
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const validation = validateImageFile(file);
  if (!validation.valid) {
    res.status(400).json({
      error: validation.error ?? "Invalid file",
    });
    return;
  }
  const result = await scanReceiptImage(file);
  console.log(result);
  if (result === null) {
    throw new InternalError("Receipt scanning failed. Try again.");
  }
  res.json({ data: result });
}

/**
 * POST /expenses/upload-receipt - Upload receipt image to Cloudinary, return URL
 */
export async function uploadReceipt(
  req: TypedRequest<never, never, never>,
  res: Response,
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      error: "No file provided",
    });
    return;
  }
  const validation = validateImageFile(file);
  if (!validation.valid) {
    res.status(400).json({
      error: validation.error ?? "Invalid file",
    });
    return;
  }
  const workspaceId = getWorkspaceId(req);
  const uploadResult = await uploadExpenseReceipt(file, workspaceId);
  const url =
    typeof uploadResult.secure_url === "string" ? uploadResult.secure_url : "";
  res.json({ data: { url } });
}

/**
 * GET /expenses - List all expenses
 */
export async function listExpenses(
  req: TypedRequest<never, typeof listExpensesSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await expensesService.listExpenses(workspaceId, query);

  res.json({
    data: result.expenses,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /expenses/stats - Get expense dashboard statistics
 */
export async function getExpenseStats(
  req: TypedRequest<never, typeof expenseStatsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;
  const result = await expensesService.getExpenseDashboardStats(
    workspaceId,
    query,
  );
  res.json({ data: result });
}

/**
 * GET /expenses/:sequence - Get expense by sequence
 */
export async function getExpenseBySequence(
  req: TypedRequest<typeof getExpenseBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const expense = await expensesService.getExpenseBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: expense,
  });
}

/**
 * POST /expenses - Create expense (multipart: flat body fields + optional receipt)
 */
export async function createExpense(
  req: TypedRequest<never, never, typeof createExpenseSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const data = req.body;

  const expense = await expensesService.createExpense(workspaceId, data);

  res.status(201).json({
    data: expense,
  });
}

/**
 * PATCH /expenses/:id - Update expense (multipart: flat body fields + optional receipt)
 */
export async function updateExpense(
  req: TypedRequest<
    typeof getExpenseByIdSchema,
    never,
    typeof updateExpenseSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  const data = req.body;

  const expense = await expensesService.updateExpense(workspaceId, id, data);

  res.json({
    data: expense,
  });
}

/**
 * DELETE /expenses/:id - Delete an expense
 */
export async function deleteExpense(
  req: TypedRequest<typeof getExpenseByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  await expensesService.deleteExpense(workspaceId, id);

  res.status(204).send();
}
