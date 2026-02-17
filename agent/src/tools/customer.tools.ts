import { llm } from "@livekit/agents";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import type { InvoiceSessionData } from "../types/session-data.js";
import { createClientSchema } from "../schemas/client.schema.js";

/**
 * Formats an email address for clear TTS pronunciation
 * Example: "user@gmail.com" -> "user at gmail dot com"
 */
function formatEmailForSpeech(email: string | null | undefined): string {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email; // Fallback if no @ found
  const normalizedDomain = domain.replace(/\./g, " dot ");
  return `${localPart} at ${normalizedDomain}`;
}

/**
 * Lookup existing customer by name or email
 */
export function createLookupCustomerTool() {
  return llm.tool({
    description:
      "Search for an existing customer by name or email in the database",
    parameters: z.object({
      query: z.string().describe("Customer name or email to search"),
    }),
    execute: async ({ query }, { ctx }) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      const customers = await prisma.client.findMany({
        where: {
          workspaceId: sessionData.workspaceId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
        },
      });

      if (customers.length === 0) {
        return {
          found: false,
          message:
            "No customers found. Please create the customer in the main application first, then try again.",
        };
      }

      // Format customer list with emails for speech
      const customerList = customers
        .map(
          (c) =>
            `- ${c.name}${c.email ? ` (${formatEmailForSpeech(c.email)})` : ""}`,
        )
        .join("\n");

      return {
        found: true,
        customers: customers,
        message: `Found ${customers.length} customer(s):\n${customerList}\nPlease confirm which one.`,
      };
    },
  });
}

/**
 * Select existing customer by ID
 */
export function createSelectCustomerTool() {
  return llm.tool({
    description:
      "Select an existing customer by ID to associate with the current invoice. Use this after lookupCustomer confirms which customer the user wants. This must be called before adding invoice items or creating the invoice.",
    parameters: z.object({
      customerId: z
        .number()
        .int()
        .positive()
        .describe(
          "The ID of the customer to select (from lookupCustomer results)",
        ),
      customerName: z
        .string()
        .describe("The name of the customer (for confirmation message)"),
    }),
    execute: async ({ customerId, customerName }, { ctx }) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      // Verify customer exists and belongs to workspace
      const customer = await prisma.client.findFirst({
        where: {
          id: customerId,
          workspaceId: sessionData.workspaceId,
        },
        select: { id: true, name: true, email: true },
      });

      if (!customer) {
        throw new llm.ToolError(
          "Customer not found or does not belong to this workspace. Please search again using lookupCustomer.",
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

      // Set the customer for this invoice
      sessionData.currentInvoice.customerId = customer.id;

      return {
        success: true,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        message: `Customer "${customer.name}" selected for this invoice.${customer.email ? ` Email: ${formatEmailForSpeech(customer.email)}` : ""}`,
      };
    },
  });
}

/**
 * Create new customer
 * DISABLED: Client creation is disabled. Users must create clients in the main application.
 */
/*
export function createCreateCustomerTool() {
  return llm.tool({
    description:
      "Create a new customer in the database. Phone numbers must be in international format with + prefix (e.g., +573011234567).",
    parameters: z.object({
      name: createClientSchema.shape.name.describe("Customer full name"),
      email: createClientSchema.shape.email.describe(
        "Customer email address",
      ),
      phone: createClientSchema.shape.phone.describe(
        "Customer phone number in international format (e.g., +573011234567). Must start with + followed by country code and number.",
      ),
      address:
        createClientSchema.shape.address.describe("Customer address"),
      nit: createClientSchema.shape.nit.describe("Tax ID or NIT"),
      businessName: createClientSchema.shape.businessName.describe(
        "Business name if applicable",
      ),
      reminderBeforeDueIntervalDays:
        createClientSchema.shape.reminderBeforeDueIntervalDays.describe(
          "Reminder interval before due date in days (e.g., 3 = every 3 days while invoice active). Leave empty to disable.",
        ),
      reminderAfterDueIntervalDays:
        createClientSchema.shape.reminderAfterDueIntervalDays.describe(
          "Reminder interval after due date in days (e.g., 1 = every 1 day when past due). Leave empty to disable.",
        ),
    }),
    execute: async (
      {
        name,
        email,
        phone,
        address,
        nit,
        businessName,
        reminderBeforeDueIntervalDays,
        reminderAfterDueIntervalDays,
      },
      { ctx },
    ) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      // Get next sequence number
      const lastClient = await prisma.client.findFirst({
        where: { workspaceId: sessionData.workspaceId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });

      const customer = await prisma.client.create({
        data: {
          workspaceId: sessionData.workspaceId,
          name,
          email,
          phone: phone || null,
          address: address || null,
          nit: nit || null,
          businessName: businessName || null,
          reminderBeforeDueIntervalDays:
            reminderBeforeDueIntervalDays || null,
          reminderAfterDueIntervalDays:
            reminderAfterDueIntervalDays || null,
          sequence: (lastClient?.sequence || 0) + 1,
        },
      });

      // Store customer ID in session
      if (!sessionData.currentInvoice) {
        sessionData.currentInvoice = {
          items: [],
          subtotal: 0,
          totalTax: 0,
          discount: 0,
          total: 0,
        };
      }
      sessionData.currentInvoice.customerId = customer.id;

      return {
        success: true,
        customerId: customer.id,
        message: `Customer "${name}" created successfully!`,
      };
    },
  });
}
*/