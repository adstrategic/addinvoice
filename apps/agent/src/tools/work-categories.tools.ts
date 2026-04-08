import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

export function createSearchWorkCategoriesTool() {
  return llm.tool({
    description:
      'Search work categories (global and workspace-specific) by name. Use this when the user provides a category name for an expense.',
    parameters: z.object({
      query: z.string().trim().min(1).max(255).describe('Category name to search for'),
    }),
    execute: async ({ query }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        const categories = await prisma.workCategory.findMany({
          where: {
            AND: [
              {
                name: { contains: query, mode: 'insensitive' },
              },
              {
                OR: [{ workspaceId: null }, { workspaceId: sessionData.workspaceId }],
              },
            ],
          },
          take: 5,
          orderBy: { sequence: 'asc' },
          select: { id: true, name: true, icon: true, workspaceId: true },
        });

        if (categories.length === 0) {
          return {
            found: false,
            message: `No work categories found matching "${query}".`,
            categories: [],
          };
        }

        const categoriesPayload = categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon ?? null,
          workspaceId: c.workspaceId ?? null,
        }));

        return {
          found: true,
          categories: categoriesPayload,
          message:
            `Found ${categories.length} work category${categories.length === 1 ? '' : 'ies'}. ` +
            'Please choose which one to use.',
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to search work categories. Please try again.');
      }
    },
  });
}

export function createSelectWorkCategoryTool() {
  return llm.tool({
    description: 'Select a work category by ID for the current expense draft.',
    parameters: z.object({
      workCategoryId: z.number().int().describe('Work category ID to select'),
    }),
    execute: async ({ workCategoryId }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        const category = await prisma.workCategory.findFirst({
          where: {
            id: workCategoryId,
            OR: [{ workspaceId: null }, { workspaceId: sessionData.workspaceId }],
          },
          select: { id: true, name: true },
        });

        if (!category) {
          throw new llm.ToolError('Work category not found for this workspace.');
        }

        if (!sessionData.currentExpense) {
          sessionData.currentExpense = {
            description: null,
            amount: 0,
            categoryWorkCategoryId: null,
            tax: null,
          };
        }

        sessionData.currentExpense.categoryWorkCategoryId = category.id;

        return {
          success: true,
          workCategoryId: category.id,
          message: `Category "${category.name}" selected for this expense.`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to select work category. Please try again.');
      }
    },
  });
}
