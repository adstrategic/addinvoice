import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

function parseDateOnlyUtc(dateStr: string): Date {
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) throw new Error('Invalid date format');
  const year = parseInt(dateParts[0]!, 10);
  const month = parseInt(dateParts[1]!, 10) - 1;
  const day = parseInt(dateParts[2]!, 10);
  const parsed = new Date(Date.UTC(year, month, day));
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

export function createCreateExpenseTool() {
  return llm.tool({
    description:
      'Create a new expense record for the workspace using the current expense draft values.',
    parameters: z.object({
      description: z.string().trim().max(2000).nullish().describe('Expense description'),
      amount: z.number().describe('Expense total amount'),
      expenseDate: z
        .string()
        .nullish()
        .describe('Expense date in YYYY-MM-DD format. Defaults to today.'),
      notes: z.string().trim().max(2000).nullish().describe('Optional expense notes'),
      tax: z.number().nullish().describe('Optional tax amount (if applicable)'),
    }),
    execute: async ({ description, amount, expenseDate, notes, tax }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        const draft = sessionData.currentExpense ?? {
          description: null,
          amount: 0,
          expenseDate: undefined,
          categoryWorkCategoryId: null,
          notes: undefined,
          tax: null,
        };

        const resolvedExpenseDate = expenseDate ? parseDateOnlyUtc(expenseDate) : undefined;
        const now = new Date();
        const expenseDay =
          resolvedExpenseDate ??
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        expenseDay.setUTCHours(0, 0, 0, 0);

        const last = await prisma.expense.findFirst({
          where: { workspaceId: sessionData.workspaceId },
          orderBy: { sequence: 'desc' },
          select: { sequence: true },
        });
        const nextSequence = (last?.sequence || 0) + 1;

        const resolvedDescription =
          description && description.trim().length > 0
            ? notes && notes.trim().length > 0
              ? `${description.trim()}\nNotes: ${notes.trim()}`
              : description.trim()
            : notes && notes.trim().length > 0
              ? `Notes: ${notes.trim()}`
              : null;

        const expense = await prisma.expense.create({
          data: {
            workspaceId: sessionData.workspaceId,
            sequence: nextSequence,
            expenseDate: expenseDay,
            merchantId: null,
            workCategoryId: draft.categoryWorkCategoryId ?? null,
            description: resolvedDescription,
            image: null,
            total: amount,
            tax: tax ?? null,
          },
          include: { workCategory: true, merchant: true },
        });

        sessionData.currentExpense = null;

        return {
          success: true,
          expenseId: expense.id,
          expenseSequence: expense.sequence,
          message: `Expense created successfully. Amount: $${Number(expense.total).toFixed(2)}`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to create expense. Please try again.');
      }
    },
  });
}
