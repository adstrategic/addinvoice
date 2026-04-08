import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

export function createCreateCatalogTool() {
  return llm.tool({
    description:
      'Create a new product entry in the catalog for the selected business. The catalog is used to prefill invoice/estimate line items.',
    parameters: z.object({
      name: z.string().trim().min(1).max(255).describe('Product name'),
      description: z
        .string()
        .trim()
        .min(1)
        .max(1000)
        .describe('Product description shown to customers'),
      unitPrice: z.number().describe('Unit price (in dollars)'),
    }),
    execute: async ({ name, description, unitPrice }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const businessId = sessionData.selectedBusinessId;

        if (!businessId) {
          throw new llm.ToolError('No business selected. Please select a business first.');
        }

        const last = await prisma.catalog.findFirst({
          where: { workspaceId: sessionData.workspaceId },
          orderBy: { sequence: 'desc' },
          select: { sequence: true },
        });

        const nextSequence = (last?.sequence || 0) + 1;

        const catalog = await prisma.catalog.create({
          data: {
            workspaceId: sessionData.workspaceId,
            businessId,
            name,
            description,
            price: unitPrice,
            quantityUnit: 'UNITS',
            sequence: nextSequence,
          },
          include: { business: true },
        });

        return {
          success: true,
          catalogId: catalog.id,
          message: `Product "${catalog.name}" created successfully.`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to create product. Please try again.');
      }
    },
  });
}
