import { createExpenseBaseSchema } from "@addinvoice/schemas";
import { z } from "zod";

import { merchantEntitySchema } from "../merchants/merchants.schemas.js";
import { workCategoryEntitySchema } from "../work-categories/work-categories.schemas.js";

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for getting expense by sequence
 */
export const getExpenseBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for getting expense by ID (for update/delete)
 */
export const getExpenseByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

/**
 * Schema for expense entity
 */
export const expenseEntitySchema = createExpenseBaseSchema
  .omit({
    merchantName: true,
  })
  .extend({
    id: z.number().int().positive(),
    sequence: z.number().int().positive(),
    workspaceId: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
    merchant: merchantEntitySchema.nullable(),
    workCategory: workCategoryEntitySchema.nullable(),
  });

// ===== DTOs (for the service) =====

export type ExpenseEntity = z.infer<typeof expenseEntitySchema>;
export type GetExpenseByIdParams = z.infer<typeof getExpenseByIdSchema>;
export type GetExpenseBySequenceParams = z.infer<
  typeof getExpenseBySequenceSchema
>;
