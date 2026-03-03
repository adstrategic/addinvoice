import {
  createExpenseSchema,
  expenseStatsSchema,
  listExpensesSchema,
  updateExpenseSchema,
} from "@addinvoice/schemas";
import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createExpense,
  deleteExpense,
  getExpenseBySequence,
  getExpenseStats,
  listExpenses,
  scanReceipt,
  updateExpense,
  uploadReceipt,
} from "./expenses.controller.js";
import {
  getExpenseByIdSchema,
  getExpenseBySequenceSchema,
} from "./expenses.schemas.js";
/**
 * Expenses routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 */
export const expensesRoutes: Router = Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

// POST /api/v1/expenses/upload-receipt - Upload receipt to Cloudinary (returns URL)
expensesRoutes.post(
  "/upload-receipt",
  upload.single("receipt") as never,
  asyncHandler(uploadReceipt),
);

// POST /api/v1/expenses/scan-receipt - Extract receipt data via Claude Vision (before /:sequence)
expensesRoutes.post(
  "/scan-receipt",
  upload.single("receipt") as never,
  asyncHandler(scanReceipt),
);

// GET /api/v1/expenses - List all expenses
expensesRoutes.get(
  "/",
  processRequest({ query: listExpensesSchema }),
  asyncHandler(listExpenses),
);

// GET /api/v1/expenses/stats - Get expense dashboard statistics (before /:sequence)
expensesRoutes.get(
  "/stats",
  processRequest({ query: expenseStatsSchema }),
  asyncHandler(getExpenseStats),
);

// GET /api/v1/expenses/:sequence - Get expense by sequence
expensesRoutes.get(
  "/:sequence",
  processRequest({ params: getExpenseBySequenceSchema }),
  asyncHandler(getExpenseBySequence),
);

// POST /api/v1/expenses - Create expense (multipart: flat body fields + optional receipt)
expensesRoutes.post(
  "/",
  processRequest({ body: createExpenseSchema }),
  asyncHandler(createExpense),
);

// PATCH /api/v1/expenses/:id - Update expense (multipart: flat body fields + optional receipt)
expensesRoutes.patch(
  "/:id",
  processRequest({
    params: getExpenseByIdSchema,
    body: updateExpenseSchema,
  }),
  asyncHandler(updateExpense),
);

// DELETE /api/v1/expenses/:id - Delete an expense
expensesRoutes.delete(
  "/:id",
  processRequest({ params: getExpenseByIdSchema }),
  asyncHandler(deleteExpense),
);
