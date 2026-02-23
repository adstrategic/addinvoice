import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

/**
 * List all businesses for the workspace
 */
export function createListBusinessesTool() {
  return llm.tool({
    description:
      'List all businesses available in the workspace. If exactly one business is returned, call selectBusiness with that ID immediately. If multiple are returned, list them to the user and ask which one to use, then call selectBusiness with the chosen ID.',
    parameters: z.object({}),
    execute: async (_, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        const businesses = await prisma.business.findMany({
          where: {
            workspaceId: sessionData.workspaceId,
          },
          orderBy: [
            { isDefault: 'desc' }, // Default business first
            { sequence: 'asc' },
          ],
          select: {
            id: true,
            name: true,
            isDefault: true,
          },
        });

        if (businesses.length === 0) {
          return {
            found: false,
            message: 'No businesses found. Please set up a business first in the main application.',
          };
        }

        // Format business list
        const businessList = businesses
          .map(
            (b: { id: number; name: string; isDefault?: boolean }) =>
              `- ${b.name}${b.isDefault ? ' (Default)' : ''} (ID: ${b.id})`,
          )
          .join('\n');

        return {
          found: true,
          businesses: businesses,
          message: `Found ${businesses.length} business(es):\n${businessList}\nPlease select which business to use for this invoice.`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to list businesses. Please try again.');
      }
    },
  });
}

/**
 * Select a business by ID
 */
export function createSelectBusinessTool() {
  return llm.tool({
    description:
      'Select a business by ID to use for the current invoice. Use this after listBusinesses (immediately when only one business exists, or after the user chooses when multiple exist). This must be called before creating the invoice.',
    parameters: z.object({
      businessId: z
        .number()
        .int()
        .describe('The ID of the business to select (from listBusinesses results)'),
    }),
    execute: async ({ businessId }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        // Verify business exists and belongs to workspace
        const business = await prisma.business.findFirst({
          where: {
            id: businessId,
            workspaceId: sessionData.workspaceId,
          },
          select: {
            id: true,
            name: true,
            defaultTaxMode: true,
            defaultTaxName: true,
            defaultTaxPercentage: true,
            defaultNotes: true,
            defaultTerms: true,
          },
        });

        if (!business) {
          throw new llm.ToolError(
            'Business not found or does not belong to this workspace. Please search again using listBusinesses.',
          );
        }

        // Initialize invoice session if needed
        if (!sessionData.currentInvoice) {
          sessionData.currentInvoice = {
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }

        // Set the business for this invoice
        sessionData.currentInvoice.businessId = business.id;

        return {
          success: true,
          businessId: business.id,
          businessName: business.name,
          message: `Business "${business.name}" selected for this invoice.`,
        };
      } catch {
        throw new llm.ToolError('Unable to select business');
      }
    },
  });
}
