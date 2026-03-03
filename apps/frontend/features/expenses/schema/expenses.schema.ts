import { merchantResponseSchema } from "@/features/merchants/schema/merchants.schema";
import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Work category (for dropdown / API response)
 */
export const workCategoryResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  name: z.string(),
  sequence: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Expense response schema from API
 */
export const expenseResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  merchantId: z.number().int().positive().nullable(),
  workCategoryId: z.number().int().positive().nullable(),
  expenseDate: z.string().datetime(),
  total: z.number(),
  tax: z.number().nullable(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  sequence: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  merchant: merchantResponseSchema.nullable(),
  workCategory: workCategoryResponseSchema.nullable(),
});

/**
 * List response schema
 */
export const expenseResponseListSchema = z.object({
  data: z.array(expenseResponseSchema),
  pagination: paginationMetaSchema,
});

export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
export type ExpenseResponseList = z.infer<typeof expenseResponseListSchema>;
