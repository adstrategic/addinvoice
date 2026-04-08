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

export function createListAvailableInvoicesTool() {
  return llm.tool({
    description:
      'List available invoices for the selected business so the user can choose an invoice number for payment.',
    parameters: z.object({
      includePaid: z
        .boolean()
        .optional()
        .describe('Whether to include fully paid invoices. Defaults to false.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Maximum number of invoices to return. Defaults to 10.'),
    }),
    execute: async ({ includePaid = false, limit = 10 }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const businessId = sessionData.selectedBusinessId;

        if (!businessId) {
          throw new llm.ToolError('No business selected. Please select a business first.');
        }

        const invoices = await prisma.invoice.findMany({
          where: {
            workspaceId: sessionData.workspaceId,
            businessId,
            ...(includePaid ? {} : { balance: { gt: 0 } }),
          },
          orderBy: [{ issueDate: 'desc' }, { sequence: 'desc' }],
          take: limit,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            balance: true,
            issueDate: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        });

        if (invoices.length === 0) {
          return {
            found: false,
            invoices: [],
            message: includePaid
              ? 'No invoices are available for this business.'
              : 'No open invoices with pending balance are available for this business.',
          };
        }

        const mapped = invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          clientName: inv.client?.name ?? null,
          total: Number(inv.total),
          balance: Number(inv.balance),
          issueDate: inv.issueDate.toISOString().slice(0, 10),
        }));

        const spokenList = mapped
          .map(
            (inv) =>
              `${inv.invoiceNumber} (${inv.clientName ?? 'No client'}, balance $${inv.balance.toFixed(2)})`,
          )
          .join('; ');

        return {
          found: true,
          count: mapped.length,
          invoices: mapped,
          message: `Here are the available invoices: ${spokenList}. Tell me which invoice number you want to pay.`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to list available invoices. Please try again.');
      }
    },
  });
}

export function createCreatePaymentTool() {
  return llm.tool({
    description:
      'Add a payment to an existing invoice. Resolve the invoice by invoice number (within the selected business). Updates the invoice balance and status.',
    parameters: z.object({
      invoiceNumber: z.string().trim().min(1).max(50).describe('Invoice number (e.g., INV-0001)'),
      amount: z.number().describe('Payment amount'),
      paymentDate: z
        .string()
        .nullish()
        .describe('Payment date in YYYY-MM-DD format. Defaults to today.'),
      paymentMethod: z
        .string()
        .trim()
        .min(1)
        .max(50)
        .describe('Payment method, e.g. cash, bank_transfer, card'),
      notes: z.string().trim().max(1000).nullish().describe('Optional payment details'),
      transactionId: z
        .string()
        .trim()
        .max(255)
        .nullish()
        .describe('Optional transaction reference'),
    }),
    execute: async (
      { invoiceNumber, amount, paymentDate, paymentMethod, notes, transactionId },
      { ctx },
    ) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const businessId = sessionData.selectedBusinessId;

        if (!businessId) {
          throw new llm.ToolError('No business selected. Please select a business first.');
        }

        const invoice = await prisma.invoice.findFirst({
          where: {
            workspaceId: sessionData.workspaceId,
            businessId,
            invoiceNumber,
          },
          include: {
            _count: { select: { items: true } },
          },
        });

        if (!invoice) {
          throw new llm.ToolError(
            `Invoice not found for invoice number "${invoiceNumber}". Please check the number.`,
          );
        }

        if (invoice._count.items === 0) {
          throw new llm.ToolError('Cannot add payment to an invoice with no items.');
        }

        const invoiceTotal = Number(invoice.total);
        const currentBalance = Number(invoice.balance);
        if (currentBalance <= 0) {
          throw new llm.ToolError(
            'Cannot add payment: invoice balance is already zero or fully paid.',
          );
        }

        const paidAt = paymentDate ? parseDateOnlyUtc(paymentDate) : new Date();

        const payment = await prisma.payment.create({
          data: {
            workspaceId: sessionData.workspaceId,
            invoiceId: invoice.id,
            amount,
            paymentMethod,
            transactionId: transactionId ?? null,
            details: notes ?? null,
            paidAt,
          },
        });

        const payments = await prisma.payment.findMany({
          where: { invoiceId: invoice.id },
          select: { amount: true },
        });

        const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const newBalance = invoiceTotal - totalPayments;

        // Recompute invoice status/balance (mirrors backend updateInvoiceBalanceAndStatus)
        let nextStatus = invoice.status;
        let nextPaidAt: Date | null | undefined = undefined;

        if (newBalance <= 0 && invoiceTotal > 0) {
          nextStatus = 'PAID';
          nextPaidAt = invoice.paidAt ?? new Date();
        } else if (invoice.status === 'PAID') {
          nextStatus = invoice.viewedAt ? 'VIEWED' : 'SENT';
          nextPaidAt = null;
        }

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            balance: newBalance,
            status: nextStatus,
            ...(nextPaidAt !== undefined ? { paidAt: nextPaidAt } : {}),
          },
        });

        return {
          success: true,
          paymentId: payment.id,
          message: `Payment added successfully for ${invoice.invoiceNumber}. Amount: $${amount.toFixed(2)}`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to add payment. Please try again.');
      }
    },
  });
}
