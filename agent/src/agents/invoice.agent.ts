import { voice, llm } from "@livekit/agents";
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

export class InvoiceAgent extends voice.Agent {
  constructor() {
    super({
      instructions: `You are a professional invoice creation assistant.
Your job is to help users create invoices by collecting:
1. Customer information (name, email, phone)
2. Invoice line items (description, quantity, unit price)
3. Payment terms and due date

You can also answer questions about the workspace, such as:
- How many clients are in the system
- How many invoices exist
- Count clients or invoices

IMPORTANT - Customer Selection Process:
When creating an invoice, you MUST follow this customer selection process:
1. First use lookupCustomer to search for the customer by name or email
2. If ONE customer is found, confirm with the user, then use selectCustomer to select them
3. If MULTIPLE customers are found, list them clearly and ask which one, then use selectCustomer with the chosen customer ID
4. If NO customers are found, ask if they want to create a new one, then use createCustomer
5. NEVER call createInvoice until a customer has been selected (via selectCustomer) or created (via createCustomer)
6. Always confirm the customer selection with the user before proceeding to add invoice items

IMPORTANT - Phone Number Format:
When collecting phone numbers for customers or invoices, ALWAYS ask for the country code and format them in international format starting with + followed by country code and number.
- Examples: +573011234567 (Colombia), +1234567890 (USA), +441234567890 (UK)
- Pattern: +[1-9][digits] where there are 1-14 digits after the country code
- Never save a phone number without the + prefix and country code
- If a user provides a phone without country code, ask them for the country code
- Phone numbers must match the international format: +[country code][number] with 2-15 total digits after the +

IMPORTANT - Email Address Pronunciation:
When speaking email addresses aloud in your responses, ALWAYS format them for clear pronunciation to avoid TTS mispronunciation:
- Replace @ with "at" (spoken word)
- Replace . with "dot" (spoken word)
- Spell out the domain name clearly
- Examples:
  * "user@gmail.com" should be spoken as "user at gmail dot com"
  * "john@example.com" should be spoken as "john at example dot com"
  * "contact@company.co.uk" should be spoken as "contact at company dot co dot uk"
  * "admin@business.io" should be spoken as "admin at business dot i o"
- When confirming customer emails, listing search results, or mentioning any email address, always use this format in your spoken responses
- This applies to ALL email addresses you mention in conversation, whether from tool results or user input

Be friendly, efficient, and always confirm details before finalizing.
Keep responses concise without formatting symbols or emojis.
When collecting items, ask for description, quantity, and price.`,

      tools: {
        // TOOL 1: Lookup existing customer
        lookupCustomer: llm.tool({
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
                deletedAt: null,
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
                  "No customers found. Would you like to create a new customer?",
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
        }),

        // TOOL 2: Select existing customer
        selectCustomer: llm.tool({
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
                deletedAt: null,
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
        }),

        // TOOL 3: Create new customer
        createCustomer: llm.tool({
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
          }),
          execute: async (
            { name, email, phone, address, nit, businessName },
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
        }),

        // TOOL 4: Add invoice line item
        addInvoiceItem: llm.tool({
          description: "Add a line item to the current invoice being created",
          parameters: z.object({
            description: z
              .string()
              .describe("Description of the product or service"),
            quantity: z.number().positive().describe("Quantity of items"),
            unitPrice: z
              .number()
              .positive()
              .describe("Price per unit in dollars"),
            quantityUnit: z
              .enum(["DAYS", "HOURS", "UNITS"])
              .default("UNITS")
              .describe("Unit of measurement for quantity"),
          }),
          execute: async (
            { description, quantity, unitPrice, quantityUnit },
            { ctx },
          ) => {
            const sessionData = ctx.session.userData as InvoiceSessionData;

            // Initialize invoice if needed
            if (!sessionData.currentInvoice) {
              sessionData.currentInvoice = {
                items: [],
                subtotal: 0,
                totalTax: 0,
                discount: 0,
                total: 0,
              };
            }

            // Create item
            const itemTotal = quantity * unitPrice;
            const item = {
              name: description.split(" ").slice(0, 3).join(" "),
              description,
              quantity,
              quantityUnit,
              unitPrice,
              discount: 0,
              discountType: "NONE" as const,
              tax: 0,
              vatEnabled: false,
              total: itemTotal,
            };

            // Add to session
            sessionData.currentInvoice.items.push(item);

            // Recalculate totals
            sessionData.currentInvoice.subtotal =
              sessionData.currentInvoice.items.reduce(
                (sum, i) => sum + i.total,
                0,
              );
            sessionData.currentInvoice.total =
              sessionData.currentInvoice.subtotal;

            return {
              success: true,
              itemNumber: sessionData.currentInvoice.items.length,
              itemTotal: itemTotal.toFixed(2),
              runningTotal: sessionData.currentInvoice.total.toFixed(2),
              message: `Added item ${sessionData.currentInvoice.items.length}. Current total: $${sessionData.currentInvoice.total.toFixed(2)}`,
            };
          },
        }),

        // TOOL 5: Create final invoice
        createInvoice: llm.tool({
          description:
            "Save the complete invoice to the database after all details are confirmed",
          parameters: z.object({
            dueDate: z
              .string()
              .describe("Invoice due date in YYYY-MM-DD format"),
            notes: z
              .string()
              .optional()
              .describe("Additional notes for the invoice"),
          }),
          execute: async ({ dueDate, notes }, { ctx }) => {
            const sessionData = ctx.session.userData as InvoiceSessionData;

            if (
              !sessionData.currentInvoice ||
              !sessionData.currentInvoice.customerId
            ) {
              throw new llm.ToolError(
                "No customer or invoice data found. Please start over.",
              );
            }

            if (sessionData.currentInvoice.items.length === 0) {
              throw new llm.ToolError(
                "Cannot create invoice without line items.",
              );
            }

            // Get default business for workspace
            const defaultBusiness = await prisma.business.findFirst({
              where: {
                workspaceId: sessionData.workspaceId,
                isDefault: true,
              },
            });

            if (!defaultBusiness) {
              throw new llm.ToolError(
                "No default business found. Please set up a business first.",
              );
            }

            // Get customer email for invoice
            const customer = await prisma.client.findUnique({
              where: { id: sessionData.currentInvoice.customerId },
            });

            // Get next invoice sequence
            const lastInvoice = await prisma.invoice.findFirst({
              where: { workspaceId: sessionData.workspaceId },
              orderBy: { sequence: "desc" },
              select: { sequence: true },
            });
            const nextSequence = (lastInvoice?.sequence || 0) + 1;

            // Create invoice in database
            const invoice = await prisma.invoice.create({
              data: {
                workspaceId: sessionData.workspaceId,
                clientId: sessionData.currentInvoice.customerId,
                businessId: defaultBusiness.id,
                clientEmail: customer!.email,
                clientPhone: customer?.phone,
                clientAddress: customer?.address,
                sequence: nextSequence,
                invoiceNumber: `INV-${nextSequence.toString().padStart(5, "0")}`,
                status: "DRAFT",
                issueDate: new Date(),
                dueDate: new Date(dueDate),
                currency: "USD",
                subtotal: sessionData.currentInvoice.subtotal,
                totalTax: 0,
                discount: 0,
                total: sessionData.currentInvoice.total,
                balance: sessionData.currentInvoice.total,
                notes: notes || null,
                taxMode: "NONE",
                discountType: "NONE",
                items: {
                  create: sessionData.currentInvoice.items,
                },
              },
              include: {
                items: true,
                client: true,
              },
            });

            // Clear session data
            sessionData.currentInvoice = null;

            return {
              success: true,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              total: invoice.total.toString(),
              message: `Invoice ${invoice.invoiceNumber} created successfully! Total: $${invoice.total}`,
            };
          },
        }),

        // TOOL 6: Count clients
        countClients: llm.tool({
          description:
            "Count the total number of active clients in the workspace",
          parameters: z.object({}),
          execute: async (_, { ctx }) => {
            const sessionData = ctx.session.userData as InvoiceSessionData;

            const count = await prisma.client.count({
              where: {
                workspaceId: sessionData.workspaceId,
                deletedAt: null,
              },
            });

            return {
              count,
              message: `You have ${count} active client${count === 1 ? "" : "s"}.`,
            };
          },
        }),

        // TOOL 7: Count invoices
        countInvoices: llm.tool({
          description: "Count the total number of invoices in the workspace",
          parameters: z.object({}),
          execute: async (_, { ctx }) => {
            const sessionData = ctx.session.userData as InvoiceSessionData;

            const count = await prisma.invoice.count({
              where: {
                workspaceId: sessionData.workspaceId,
                deletedAt: null,
              },
            });

            return {
              count,
              message: `You have ${count} invoice${count === 1 ? "" : "s"}.`,
            };
          },
        }),
      },
    });
  }
}
