import { merchantResponseSchema } from "@/features/merchants/schema/merchants.schema";
import { paginationMetaSchema } from "@/lib/api/types";
import { fixedDateFromPrisma } from "@addinvoice/schemas";
import { z } from "zod";

/**
 * Work category (for dropdown / API response)
 */
export const workCategoryResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive().nullable(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  sequence: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Expense response schema from API
 */
export const expenseResponseSchema = z.object({
  expenseDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val))),
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  merchantId: z.number().int().positive().nullable(),
  workCategoryId: z.number().int().positive().nullable(),
  total: z.number(),
  tax: z.number().nullable(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  sequence: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
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
