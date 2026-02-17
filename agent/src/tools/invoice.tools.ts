import { llm } from "@livekit/agents";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "../db/prisma.js";
import type { InvoiceSessionData } from "../types/session-data.js";

/**
 * Generate an idempotency key for invoice creation
 * This ensures duplicate tool calls with the same content return the same invoice
 */
function generateInvoiceIdempotencyKey(
  invoiceData: NonNullable<InvoiceSessionData["currentInvoice"]>,
  dueDate: string,
  notes?: string
): string {
  // Create a deterministic hash based on invoice content
  const content = JSON.stringify({
    customerId: invoiceData.customerId,
    businessId: invoiceData.businessId,
    items: invoiceData.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      quantityUnit: item.quantityUnit,
    })),
    dueDate,
    notes: notes || null,
  });

  // Use SHA-256 hash for consistent key generation
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Add invoice line item
 */
export function createAddInvoiceItemTool() {
  return llm.tool({
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

      const items = sessionData.currentInvoice.items;

      // Idempotent: check ALL items for exact match (prevents duplicate tool calls in one turn)
      const isDuplicate = items.some(
        (existingItem) =>
          existingItem.description === description &&
          existingItem.quantity === quantity &&
          existingItem.unitPrice === unitPrice &&
          existingItem.quantityUnit === quantityUnit
      );

      if (isDuplicate) {
        const runningTotal = items.reduce((sum, i) => sum + i.total, 0);
        return {
          success: true,
          itemNumber: items.length,
          itemTotal: (quantity * unitPrice).toFixed(2),
          runningTotal: runningTotal.toFixed(2),
          message: `Item already added. Current total: $${runningTotal.toFixed(2)}`,
        };
      }

      // Push item immediately with defaults to claim the slot (before any await)
      const itemTotal = quantity * unitPrice;
      const item = {
        name: description.split(" ").slice(0, 3).join(" "),
        description,
        quantity,
        quantityUnit,
        unitPrice,
        discount: 0,
        discountType: "NONE" as const,
        tax: 0,              // Will be updated after business lookup
        vatEnabled: false,   // Will be updated after business lookup
        total: itemTotal,
      };

      items.push(item); // Push NOW to prevent race condition

      // Resolve vatEnabled and tax from business default (align with backend invoices.service.ts)
      if (sessionData.currentInvoice.businessId) {
        const business = await prisma.business.findFirst({
          where: {
            id: sessionData.currentInvoice.businessId,
            workspaceId: sessionData.workspaceId,
          },
          select: {
            defaultTaxMode: true,
            defaultTaxPercentage: true,
          },
        });
        if (business?.defaultTaxMode === "BY_TOTAL") {
          item.vatEnabled = true;
          item.tax =
            business.defaultTaxPercentage != null
              ? Number(business.defaultTaxPercentage)
              : 0;
        }
        // BY_PRODUCT or NONE: vatEnabled false, tax 0 (already set)
      }

      sessionData.currentInvoice.subtotal = items.reduce(
        (sum, i) => sum + i.total,
        0,
      );
      sessionData.currentInvoice.total =
        sessionData.currentInvoice.subtotal;

      return {
        success: true,
        itemNumber: items.length,
        itemTotal: itemTotal.toFixed(2),
        runningTotal: sessionData.currentInvoice.total.toFixed(2),
        message: `Added item ${items.length}. Current total: $${sessionData.currentInvoice.total.toFixed(2)}`,
      };
    },
  });
}

/**
 * Create final invoice
 */
export function createCreateInvoiceTool() {
  return llm.tool({
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

      // Validate current invoice exists
      if (!sessionData.currentInvoice) {
        throw new llm.ToolError(
          "No invoice to create. Please start over by selecting a customer and adding items.",
        );
      }

      const invoiceData = sessionData.currentInvoice;

      if (!invoiceData.customerId) {
        throw new llm.ToolError(
          "No customer selected. Please select a customer first.",
        );
      }

      if (!invoiceData.businessId) {
        throw new llm.ToolError(
          "No business selected. Please select a business first using selectBusiness tool.",
        );
      }

      if (invoiceData.items.length === 0) {
        throw new llm.ToolError(
          "Cannot create invoice without line items.",
        );
      }

      // Generate idempotency key from invoice content
      const idempotencyKey = generateInvoiceIdempotencyKey(
        invoiceData,
        dueDate,
        notes
      );

      // Check if we already created this exact invoice in this session
      if (sessionData.lastCreatedInvoice?.idempotencyKey === idempotencyKey) {
        const cached = sessionData.lastCreatedInvoice;

        // Verify the invoice still exists in the database
        const existingInvoice = await prisma.invoice.findUnique({
          where: { id: cached.id },
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        });

        if (existingInvoice) {
          // Return success with the existing invoice (idempotent response)
          return {
            success: true,
            invoiceId: existingInvoice.id,
            invoiceNumber: existingInvoice.invoiceNumber,
            total: existingInvoice.total.toString(),
            message: `Invoice ${existingInvoice.invoiceNumber} already created. Total: $${existingInvoice.total}`,
          };
        }
        // If invoice was deleted, continue with creation
      }

      // Get selected business with defaults (use local invoiceData)
      const business = await prisma.business.findFirst({
        where: {
          id: invoiceData.businessId,
          workspaceId: sessionData.workspaceId,
        },
        select: {
          id: true,
          defaultTaxMode: true,
          defaultTaxName: true,
          defaultTaxPercentage: true,
          defaultNotes: true,
          defaultTerms: true,
        },
      });

      if (!business) {
        throw new llm.ToolError(
          "Selected business not found. Please select a business again.",
        );
      }

      // Get customer email for invoice (use local invoiceData)
      const customer = await prisma.client.findUnique({
        where: { id: invoiceData.customerId },
      });

      // Parse and validate due date
      let parsedDueDate: Date;
      try {
        // Parse date string (YYYY-MM-DD format)
        const dateParts = dueDate.split("-");
        if (dateParts.length !== 3) {
          throw new Error("Invalid date format");
        }
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        // If year is missing or invalid, use current year
        const currentYear = new Date().getFullYear();
        const finalYear = year && year >= 2000 ? year : currentYear;
        
        parsedDueDate = new Date(finalYear, month, day);
        
        // Validate date
        if (isNaN(parsedDueDate.getTime())) {
          throw new Error("Invalid date");
        }
        
        // Ensure due date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        parsedDueDate.setHours(0, 0, 0, 0);
        
        if (parsedDueDate < today) {
          throw new llm.ToolError(
            "Due date cannot be in the past. Please provide a future date.",
          );
        }
      } catch (error) {
        if (error instanceof llm.ToolError) {
          throw error;
        }
        throw new llm.ToolError(
          `Invalid due date format. Please provide date in YYYY-MM-DD format (e.g., 2026-12-31).`,
        );
      }

      // Get next invoice sequence
      const lastInvoice = await prisma.invoice.findFirst({
        where: { workspaceId: sessionData.workspaceId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const nextSequence = (lastInvoice?.sequence || 0) + 1;

      // Use business defaults
      const taxMode = business.defaultTaxMode || "NONE";
      const taxName = taxMode === "BY_TOTAL" ? business.defaultTaxName : null;
      const taxPercentage =
        taxMode === "BY_TOTAL" && business.defaultTaxPercentage
          ? Number(business.defaultTaxPercentage)
          : null;
      const invoiceNotes = notes || business.defaultNotes || null;
      const invoiceTerms = business.defaultTerms || null;

      // Calculate tax if taxMode is BY_TOTAL (use local invoiceData)
      let totalTax = 0;
      let finalTotal = invoiceData.subtotal;
      
      if (taxMode === "BY_TOTAL" && taxPercentage) {
        totalTax = (invoiceData.subtotal * taxPercentage) / 100;
        finalTotal = invoiceData.subtotal + totalTax;
      }

      // Create invoice in database
      const invoice = await prisma.invoice.create({
        data: {
          workspaceId: sessionData.workspaceId,
          clientId: invoiceData.customerId,
          businessId: business.id,
          clientEmail: customer!.email,
          clientPhone: customer?.phone,
          clientAddress: customer?.address,
          sequence: nextSequence,
          invoiceNumber: `INV-${nextSequence.toString().padStart(5, "0")}`,
          status: "DRAFT",
          issueDate: new Date(),
          dueDate: parsedDueDate,
          currency: "USD",
          subtotal: invoiceData.subtotal,
          totalTax: totalTax,
          discount: 0,
          total: finalTotal,
          balance: finalTotal,
          notes: invoiceNotes,
          terms: invoiceTerms,
          taxMode: taxMode,
          taxName: taxName,
          taxPercentage: taxPercentage,
          discountType: "NONE",
          items: {
            create: invoiceData.items,
          },
        },
        include: {
          items: true,
          client: true,
        },
      });

      // Store created invoice for idempotency (before clearing currentInvoice)
      sessionData.lastCreatedInvoice = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: Number(invoice.total),
        createdAt: Date.now(),
        idempotencyKey,
      };

      // Clear current invoice after successful creation
      sessionData.currentInvoice = null;

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total.toString(),
        message: `Invoice ${invoice.invoiceNumber} created successfully! Total: $${invoice.total}`,
      };
    },
  });
}
