import { llm } from "@livekit/agents";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import type { InvoiceSessionData } from "../types/session-data.js";

/**
 * List all businesses for the workspace
 */
export function createListBusinessesTool() {
  return llm.tool({
    description:
      "List all businesses available in the workspace. Use this when you need to show the user available businesses to choose from.",
    parameters: z.object({}),
    execute: async (_, { ctx }) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      const businesses = await prisma.business.findMany({
        where: {
          workspaceId: sessionData.workspaceId,
        },
        orderBy: [
          { isDefault: "desc" }, // Default business first
          { sequence: "asc" },
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
          message:
            "No businesses found. Please set up a business first in the main application.",
        };
      }

      // Format business list
      const businessList = businesses
        .map(
          (b: { id: number; name: string; isDefault?: boolean }) =>
            `- ${b.name}${b.isDefault ? " (Default)" : ""} (ID: ${b.id})`,
        )
        .join("\n");

      return {
        found: true,
        businesses: businesses,
        message: `Found ${businesses.length} business(es):\n${businessList}\nPlease select which business to use for this invoice.`,
      };
    },
  });
}

/**
 * Select a business by ID
 */
export function createSelectBusinessTool() {
  return llm.tool({
    description:
      "Select a business by ID to use for the current invoice. Use this after listBusinesses shows available businesses. This must be called before creating the invoice.",
    parameters: z.object({
      businessId: z
        .number()
        .int()
        .positive()
        .describe(
          "The ID of the business to select (from listBusinesses results)",
        ),
      businessName: z
        .string()
        .describe("The name of the business (for confirmation message)"),
    }),
    execute: async ({ businessId, businessName }, { ctx }) => {
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
          "Business not found or does not belong to this workspace. Please search again using listBusinesses.",
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
    },
  });
}
