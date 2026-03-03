import { z } from "zod";
import { nullableOptional } from "./shared.js";

/**
 * Schema for listing expenses
 */
export const listExpensesSchema = z.object({
  merchantId: z.coerce.number().int().positive().optional(),
  workCategoryId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
});

/**
 * Schema for creating a work category (reusable across modules).
 */
export const createWorkCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(255, "Category name is too long"),
  icon: z.string().trim().max(50).optional(),
});

export const createExpenseBaseSchema = z.object({
  workCategoryId: z.number().int().positive().nullable(),
  merchantId: z.number().int().min(-1).nullable(),
  merchantName: nullableOptional(z.string().trim().min(1).max(255)),
  expenseDate: z.coerce.date(),
  total: z.number().positive("Total must be a positive number"),
  tax: nullableOptional(z.number().min(0)),
  description: nullableOptional(z.string().trim().max(2000)),
  image: nullableOptional(z.string().trim().max(2000)),
});

/**
 * Schema for creating an expense.
 * merchantId: > 0 = existing merchant, 0 or null = no merchant, -1 = create new (then merchantName required).
 */
export const createExpenseSchema = createExpenseBaseSchema.refine(
  (data) => {
    // Allow merchantId to be null/undefined/any number,
    // but: if it's -1, merchantName must be a non-empty string
    if (data.merchantId === -1) {
      return (
        typeof data.merchantName === "string" &&
        data.merchantName.trim().length > 0
      );
    }
    // Otherwise, ok (no extra requirement)
    return true;
  },
  {
    message: "merchant name is required when creating a new merchant.",
    path: ["merchantName"],
  },
);
export const updateExpenseSchema = createExpenseBaseSchema.partial().refine(
  (data) => {
    // Allow merchantId to be null/undefined/any number,
    // but: if it's -1, merchantName must be a non-empty string
    if (data.merchantId === -1) {
      return (
        typeof data.merchantName === "string" &&
        data.merchantName.trim().length > 0
      );
    }
    // Otherwise, ok (no extra requirement)
    return true;
  },
  {
    message: "merchant name is required when creating a new merchant.",
    path: ["merchantName"],
  },
);

/**
 * Schema for receipt scan result (Claude Vision extraction).
 * All fields nullable when not found or unclear.
 */
export const receiptScanResultSchema = z.object({
  total: z.number().positive().nullable(),
  tax: z.number().min(0).nullable(),
  expenseDate: z.string().nullable(), // ISO date or date-only (YYYY-MM-DD)
  description: z.string().trim().max(2000).nullable(),
});

/**
 * Schema for expense dashboard stats query
 */
export const expenseStatsSchema = z.object({
  workCategoryId: z.coerce.number().int().positive().optional(),
});

/**
 * Monthly expense amount for dashboard chart
 */
export const monthlyExpenseSchema = z.object({
  month: z.string(),
  amount: z.number(),
});

/**
 * Schema for expense dashboard stats response
 */
export const expenseDashboardStatsResponseSchema = z.object({
  totalExpenses: z.number(),
  totalAmount: z.number(),
  thisWeekExpenses: z.number(),
  thisMonthExpenses: z.number(),
  monthlyExpenses: z.array(monthlyExpenseSchema),
  recentExpenses: z.array(z.any()),
});

export type ListExpensesQuery = z.infer<typeof listExpensesSchema>;
export type ExpenseStatsQuery = z.infer<typeof expenseStatsSchema>;
export type ExpenseDashboardStatsResponse = z.infer<
  typeof expenseDashboardStatsResponseSchema
>;
export type MonthlyExpense = z.infer<typeof monthlyExpenseSchema>;
export type CreateWorkCategoryDTO = z.infer<typeof createWorkCategorySchema>;
export type CreateExpenseBaseDTO = z.infer<typeof createExpenseBaseSchema>;
export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;
export type ReceiptScanResult = z.infer<typeof receiptScanResultSchema>;
