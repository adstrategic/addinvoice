import { llm } from '@livekit/agents';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

/**
 * Generate an idempotency key for invoice creation
 * This ensures duplicate tool calls with the same content return the same invoice
 */
function generateInvoiceIdempotencyKey(
  invoiceData: NonNullable<InvoiceSessionData['currentInvoice']>,
  dueDate: string,
  issueDate?: string | null,
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
    issueDate: issueDate || null,
  });

  // Use SHA-256 hash for consistent key generation
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generate invoice number aligned with backend `getNextInvoiceNumberInternal`.
 *
 * - Uses `workspace.invoiceNumberPrefix` if configured.
 * - Searches the last invoice for the selected business that matches the prefix.
 * - Extracts the last numeric run from the invoice number, increments it, and pads to 4 digits.
 */
async function getNextInvoiceNumber(workspaceId: number, businessId: number): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { invoiceNumberPrefix: true },
  });

  const configuredPrefix = workspace?.invoiceNumberPrefix ?? null;

  if (configuredPrefix) {
    const lastInvoiceWithPrefix = await prisma.invoice.findFirst({
      where: {
        businessId,
        workspaceId,
        invoiceNumber: { startsWith: configuredPrefix },
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoiceWithPrefix) return `${configuredPrefix}0001`;

    const matches = lastInvoiceWithPrefix.invoiceNumber.match(/\d+/g);
    const extracted = matches && matches.length > 0 ? parseInt(matches.at(-1)!, 10) : null;
    const nextNumber = extracted != null && !isNaN(extracted) ? extracted + 1 : 1;
    const padded = nextNumber.toString().padStart(4, '0');
    return `${configuredPrefix}${padded}`;
  }

  const lastInvoice = await prisma.invoice.findFirst({
    where: { businessId, workspaceId },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  if (!lastInvoice) return 'INV-0001';

  const prefixMatch = /^[^0-9]*/.exec(lastInvoice.invoiceNumber);
  const preservedPrefix = prefixMatch ? prefixMatch[0] : 'INV-';

  const matches = lastInvoice.invoiceNumber.match(/\d+/g);
  const extracted = matches && matches.length > 0 ? parseInt(matches.at(-1)!, 10) : null;
  const nextNumber = extracted != null && !isNaN(extracted) ? extracted + 1 : 1;
  const padded = nextNumber.toString().padStart(4, '0');
  return `${preservedPrefix}${padded}`;
}

/**
 * Add invoice line item
 */
export function createAddInvoiceItemTool() {
  return llm.tool({
    description: 'Add a line item to the current invoice being created',
    parameters: z.object({
      description: z.string().trim().describe('Description of the product or service'),
      quantity: z.number().describe('Quantity of items'),
      unitPrice: z.number().describe('Price per unit in dollars'),
      quantityUnit: z
        .enum(['DAYS', 'HOURS', 'UNITS'])
        .describe('Unit of measurement for quantity. Defaults to UNITS if not specified.'),
    }),
    execute: async ({ description, quantity, unitPrice, quantityUnit = 'UNITS' }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        // description is already trimmed by Zod schema

        if (!sessionData.selectedBusinessId && !sessionData.currentInvoice?.businessId) {
          throw new llm.ToolError('No business selected. Please select a business first.');
        }

        // Initialize invoice if needed
        if (!sessionData.currentInvoice) {
          sessionData.currentInvoice = {
            businessId: sessionData.selectedBusinessId!,
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }

        const currentInvoice = sessionData.currentInvoice!;
        const items = currentInvoice.items;

        // Idempotent: check for duplicate using normalized description (case-insensitive)
        const descNorm = description.toLowerCase();
        const isDuplicate = items.some(
          (existingItem) =>
            existingItem.description.trim().toLowerCase() === descNorm &&
            existingItem.quantity === quantity &&
            existingItem.unitPrice === unitPrice &&
            existingItem.quantityUnit === quantityUnit,
        );

        if (isDuplicate) {
          const runningTotal = currentInvoice.total;
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
          name: description,
          description,
          quantity,
          quantityUnit,
          unitPrice,
          discount: 0,
          discountType: 'NONE' as const,
          tax: 0, // Will be updated after business lookup
          vatEnabled: false, // Will be updated after business lookup
          total: itemTotal,
        };

        items.push(item); // Push NOW to prevent race condition

        // Resolve tax defaults from business default (align with backend invoices.service.ts)
        let effectiveTaxMode: 'BY_PRODUCT' | 'BY_TOTAL' | 'NONE' = 'NONE';
        let effectiveTaxPercentage = 0;

        const effectiveBusinessId = currentInvoice.businessId ?? sessionData.selectedBusinessId;
        if (effectiveBusinessId) {
          const business = await prisma.business.findFirst({
            where: {
              id: effectiveBusinessId,
              workspaceId: sessionData.workspaceId,
            },
            select: {
              defaultTaxMode: true,
              defaultTaxPercentage: true,
            },
          });

          effectiveTaxMode = business?.defaultTaxMode ?? 'NONE';
          effectiveTaxPercentage =
            business?.defaultTaxPercentage != null ? Number(business.defaultTaxPercentage) : 0;

          if (effectiveTaxMode === 'BY_TOTAL') {
            item.vatEnabled = true;
            item.tax = effectiveTaxPercentage;
          } else if (effectiveTaxMode === 'BY_PRODUCT') {
            item.vatEnabled = false;
            item.tax = effectiveTaxPercentage;
          } else {
            item.vatEnabled = false;
            item.tax = 0;
          }
        }

        currentInvoice.subtotal = items.reduce((sum, i) => sum + i.total, 0);
        let totalTax = 0;
        if (effectiveTaxMode === 'BY_TOTAL') {
          totalTax = items.reduce(
            (sum, i) => sum + (i.vatEnabled ? i.total : 0) * (effectiveTaxPercentage / 100),
            0,
          );
        } else if (effectiveTaxMode === 'BY_PRODUCT') {
          totalTax = items.reduce((sum, i) => sum + i.total * (i.tax / 100), 0);
        }

        currentInvoice.totalTax = totalTax;
        currentInvoice.total = currentInvoice.subtotal + currentInvoice.totalTax;

        return {
          success: true,
          itemNumber: items.length,
          itemTotal: itemTotal.toFixed(2),
          runningTotal: currentInvoice.total.toFixed(2),
          message: `Added item ${items.length}. Current total: $${currentInvoice.total.toFixed(2)}`,
        };
      } catch (error) {
        console.error('[tool][addInvoiceItem] failed', error);
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to add invoice item. Please try again.');
      }
    },
  });
}

/**
 * Create final invoice
 */
export function createCreateInvoiceTool() {
  return llm.tool({
    description:
      'Save the complete invoice to the database after all details are confirmed. Pass issueDate (YYYY-MM-DD) only when the user provided it; otherwise the issue date defaults to today.',
    parameters: z.object({
      dueDate: z.string().describe('Invoice due date in YYYY-MM-DD format'),
      issueDate: z
        .string()
        .nullish()
        .describe('Invoice issue date in YYYY-MM-DD format. If omitted, today is used.'),
    }),
    execute: async ({ dueDate, issueDate: issueDateParam }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        // Validate current invoice exists
        if (!sessionData.currentInvoice) {
          throw new llm.ToolError(
            'No invoice to create. Please start over by selecting a customer and adding items.',
          );
        }

        const invoiceData = sessionData.currentInvoice;

        if (!invoiceData.customerId) {
          throw new llm.ToolError('No customer selected. Please select a customer first.');
        }

        const effectiveBusinessId = invoiceData.businessId ?? sessionData.selectedBusinessId;
        if (!effectiveBusinessId) {
          throw new llm.ToolError(
            'No business selected. Please select a business first using selectBusiness tool.',
          );
        }

        if (invoiceData.items.length === 0) {
          throw new llm.ToolError('Cannot create invoice without line items.');
        }

        // Parse and validate issue date when provided (treat as date-only in UTC)
        let parsedIssueDate: Date;
        if (issueDateParam) {
          try {
            const dateParts = issueDateParam.split('-');
            if (dateParts.length !== 3) {
              throw new Error('Invalid date format');
            }
            const year = parseInt(dateParts[0]!, 10);
            const month = parseInt(dateParts[1]!, 10) - 1;
            const day = parseInt(dateParts[2]!, 10);
            const now = new Date();
            const currentYear = now.getUTCFullYear();
            const finalYear = year && year >= 2000 ? year : currentYear;
            // Use UTC midnight to avoid timezone-based date shifts
            parsedIssueDate = new Date(Date.UTC(finalYear, month, day));
            if (isNaN(parsedIssueDate.getTime())) {
              throw new Error('Invalid date');
            }
            parsedIssueDate.setUTCHours(0, 0, 0, 0);
          } catch (error) {
            if (error instanceof llm.ToolError) {
              throw error;
            }
            throw new llm.ToolError(
              `Invalid issue date format. Please provide date in YYYY-MM-DD format (e.g., 2026-01-15).`,
            );
          }
        } else {
          // Today in UTC (date-only)
          const now = new Date();
          parsedIssueDate = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
          );
          parsedIssueDate.setUTCHours(0, 0, 0, 0);
        }

        // Generate idempotency key from invoice content
        const idempotencyKey = generateInvoiceIdempotencyKey(
          invoiceData,
          dueDate,
          issueDateParam ?? undefined,
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
            id: effectiveBusinessId,
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
          throw new llm.ToolError('Selected business not found. Please select a business again.');
        }

        // Get customer email for invoice (use local invoiceData)
        const customer = await prisma.client.findUnique({
          where: { id: invoiceData.customerId },
        });

        // Parse and validate due date (treat as date-only in UTC)
        let parsedDueDate: Date;
        try {
          // Parse date string (YYYY-MM-DD format)
          const dateParts = dueDate.split('-');
          if (dateParts.length !== 3) {
            throw new Error('Invalid date format');
          }

          const year = parseInt(dateParts[0]!, 10);
          const month = parseInt(dateParts[1]!, 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2]!, 10);

          // If year is missing or invalid, use current year (in UTC)
          const now = new Date();
          const currentYear = now.getUTCFullYear();
          const finalYear = year && year >= 2000 ? year : currentYear;

          // Use UTC midnight to avoid timezone-based date shifts
          parsedDueDate = new Date(Date.UTC(finalYear, month, day));

          // Validate date
          if (isNaN(parsedDueDate.getTime())) {
            throw new Error('Invalid date');
          }

          // Ensure due date is not in the past (compare using UTC date-only)
          const todayUtc = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
          );
          parsedDueDate.setUTCHours(0, 0, 0, 0);

          if (parsedDueDate < todayUtc) {
            throw new llm.ToolError(
              'Due date cannot be in the past. Please provide a future date.',
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
          orderBy: { sequence: 'desc' },
          select: { sequence: true },
        });
        const nextSequence = (lastInvoice?.sequence || 0) + 1;

        // Use business defaults
        const taxMode = business.defaultTaxMode || 'NONE';
        const taxName = taxMode === 'BY_TOTAL' ? business.defaultTaxName : null;
        const taxPercentage =
          taxMode === 'BY_TOTAL' && business.defaultTaxPercentage != null
            ? Number(business.defaultTaxPercentage)
            : null;
        const invoiceTerms = business.defaultTerms || null;

        // Calculate totals aligned with backend logic (discount=0, discountType=NONE).
        let totalTax = 0;
        if (taxMode === 'BY_TOTAL' && taxPercentage != null) {
          totalTax = invoiceData.items.reduce(
            (sum, i) => sum + (i.vatEnabled ? i.total : 0) * (taxPercentage / 100),
            0,
          );
        } else if (taxMode === 'BY_PRODUCT') {
          totalTax = invoiceData.items.reduce((sum, i) => sum + i.total * (i.tax / 100), 0);
        }
        const finalTotal = invoiceData.subtotal + totalTax;

        const invoiceNumber = await getNextInvoiceNumber(
          sessionData.workspaceId,
          effectiveBusinessId,
        );

        // Create invoice in database
        const invoice = await prisma.invoice.create({
          data: {
            workspaceId: sessionData.workspaceId,
            clientId: invoiceData.customerId,
            businessId: business.id,
            clientEmail: customer!.email,
            clientPhone: customer?.phone ?? null,
            clientAddress: customer?.address ?? null,
            sequence: nextSequence,
            invoiceNumber,
            status: 'DRAFT',
            issueDate: parsedIssueDate,
            dueDate: parsedDueDate,
            currency: invoiceData.currency ?? 'USD',
            subtotal: invoiceData.subtotal,
            totalTax: totalTax,
            discount: 0,
            total: finalTotal,
            balance: finalTotal,
            notes: invoiceData.notes ?? business.defaultNotes ?? null,
            terms: invoiceData.terms ?? invoiceTerms,
            taxMode: taxMode,
            taxName: taxName,
            taxPercentage: taxPercentage,
            discountType: 'NONE',
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
      } catch (error) {
        console.error('[tool][createInvoice] failed', error);
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to create invoice. Please try again.');
      }
    },
  });
}
