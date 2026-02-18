import { llm } from "@livekit/agents";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import type { InvoiceSessionData } from "../types/session-data.js";

/**
 * Count clients
 */
export function createCountClientsTool() {
  return llm.tool({
    description:
      "Count the total number of active clients in the workspace",
    parameters: z.object({}),
    execute: async (_, { ctx }) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      const count = await prisma.client.count({
        where: {
          workspaceId: sessionData.workspaceId,
        },
      });

      return {
        count,
        message: `You have ${count} active client${count === 1 ? "" : "s"}.`,
      };
    },
  });
}

/**
 * Count invoices
 */
export function createCountInvoicesTool() {
  return llm.tool({
    description: "Count the total number of invoices in the workspace",
    parameters: z.object({}),
    execute: async (_, { ctx }) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      const count = await prisma.invoice.count({
        where: {
          workspaceId: sessionData.workspaceId,
        },
      });

      return {
        count,
        message: `You have ${count} invoice${count === 1 ? "" : "s"}.`,
      };
    },
  });
}
