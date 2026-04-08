import type { Prisma } from '@addinvoice/db';
import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import type { InvoiceSessionData } from '../types/session-data.js';

const invoiceStatusZ = z.enum(['DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE']);
const estimateStatusZ = z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'INVOICED']);
const entityCountZ = z.enum(['clients', 'invoices', 'estimates', 'expenses', 'catalog']);
const catalogSortByZ = z.enum(['sequence', 'name', 'price']);
const catalogSortOrderZ = z.enum(['asc', 'desc']);

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;
const LIMIT_MAX_INVOICES = 50;
const LIMIT_MAX_ESTIMATES = 50;
const LIMIT_MAX_CLIENTS = 50;
const LIMIT_MAX_EXPENSES = 30;
const LIMIT_MAX_CATALOG = 30;

function resolveBusinessId(
  sessionData: InvoiceSessionData,
  businessIdParam?: number | null,
): number | undefined {
  if (businessIdParam != null && businessIdParam > 0) {
    return businessIdParam;
  }
  return sessionData.selectedBusinessId;
}

function clampLimit(raw: number | undefined, max: number): number {
  const n = raw ?? LIMIT_DEFAULT;
  return Math.min(Math.max(1, n), max);
}

function money(n: number): string {
  return n.toFixed(2);
}

/**
 * Read-only insight tools shared across all workflow agents.
 * Query shapes mirror backend list/aggregate logic (invoices, estimates, clients, expenses, catalog, dashboard).
 */
export function getSharedInsightTools() {
  const getFinancialSummary = llm.tool({
    description:
      'Get workspace financial summary: total revenue from recorded payments, total outstanding amount clients owe on open invoices, and total expenses. Revenue and outstanding can be scoped to a business; expenses are always workspace-wide.',
    parameters: z.object({
      businessId: z
        .number()
        .int()

        .optional()
        .nullable()
        .describe(
          'Filter revenue and outstanding to this business. If omitted, uses the selected business from the session when set; otherwise all businesses in the workspace.',
        ),
    }),
    execute: async ({ businessId: businessIdParam }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const businessId = resolveBusinessId(sessionData, businessIdParam ?? undefined);
        const scopeNote =
          businessId != null
            ? 'for the selected or specified business'
            : 'across all businesses in this workspace';

        console.log(
          `[tool][getFinancialSummary] workspaceId=${workspaceId} businessId=${businessId ?? 'all'}`,
        );

        const paymentWhere: Prisma.PaymentWhereInput = {
          workspaceId,
          invoice: {
            ...(businessId != null ? { businessId } : {}),
          },
        };

        const invoiceBaseWhere: Prisma.InvoiceWhereInput = {
          workspaceId,
          ...(businessId != null ? { businessId } : {}),
        };

        const [revenueAgg, outstandingRows, expenseAgg] = await Promise.all([
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: paymentWhere,
          }),
          prisma.invoice.findMany({
            where: {
              ...invoiceBaseWhere,
              status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
            },
            select: { balance: true },
          }),
          prisma.expense.aggregate({
            _sum: { total: true },
            where: { workspaceId },
          }),
        ]);

        const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
        const totalOutstanding = outstandingRows.reduce((sum, row) => sum + Number(row.balance), 0);
        const totalExpenses = Number(expenseAgg._sum.total ?? 0);

        return (
          `Financial summary ${scopeNote}. ` +
          `Total revenue from payments is ${money(totalRevenue)}. ` +
          `Outstanding owed on open invoices is ${money(totalOutstanding)}. ` +
          `Total recorded expenses for the whole workspace are ${money(totalExpenses)}. ` +
          `Note: expenses are not tied to a business in the database.`
        );
      } catch (error) {
        console.error('[tool][getFinancialSummary] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to load financial summary.',
        );
      }
    },
  });

  const countEntities = llm.tool({
    description:
      'Count how many records exist for clients, invoices, estimates, expenses, or catalog items. Optionally filter by business (where applicable), invoice/estimate status, or search text.',
    parameters: z.object({
      entity: entityCountZ,
      businessId: z
        .number()
        .int()
        .optional()
        .nullable()
        .describe(
          'For invoices, estimates, and catalog. Uses session selected business if omitted.',
        ),
      status: z
        .union([invoiceStatusZ, estimateStatusZ])
        .optional()
        .nullable()
        .describe('Status filter for invoices or estimates only.'),
      search: z
        .string()
        .trim()
        .optional()
        .nullable()
        .describe('Search filter like list endpoints.'),
    }),
    execute: async ({ entity, businessId: businessIdParam, status, search }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const businessId = resolveBusinessId(sessionData, businessIdParam ?? undefined);
        const q = search?.trim() || undefined;

        console.log(
          `[tool][countEntities] workspaceId=${workspaceId} entity=${entity} businessId=${businessId ?? 'none'} status=${status ?? 'none'}`,
        );

        let total = 0;
        let label = '';

        switch (entity) {
          case 'clients': {
            label = 'clients';
            const where: Prisma.ClientWhereInput = {
              workspaceId,
              ...(q && {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q, mode: 'insensitive' } },
                  { businessName: { contains: q, mode: 'insensitive' } },
                ],
              }),
            };
            total = await prisma.client.count({ where });
            break;
          }
          case 'invoices': {
            label = 'invoices';
            const invoiceStatusParsed =
              status === undefined || status === null ? null : invoiceStatusZ.safeParse(status);
            const statusFilter = invoiceStatusParsed?.success
              ? invoiceStatusParsed.data
              : undefined;
            const where: Prisma.InvoiceWhereInput = {
              workspaceId,
              ...(businessId != null ? { businessId } : {}),
              ...(statusFilter !== undefined ? { status: statusFilter } : {}),
              ...(q && {
                OR: [
                  { invoiceNumber: { contains: q, mode: 'insensitive' } },
                  { client: { name: { contains: q, mode: 'insensitive' } } },
                  { client: { businessName: { contains: q, mode: 'insensitive' } } },
                ],
              }),
            };
            total = await prisma.invoice.count({ where });
            break;
          }
          case 'estimates': {
            label = 'estimates';
            const estimateStatusParsed =
              status === undefined || status === null ? null : estimateStatusZ.safeParse(status);
            const statusFilter = estimateStatusParsed?.success
              ? estimateStatusParsed.data
              : undefined;
            const where: Prisma.EstimateWhereInput = {
              workspaceId,
              ...(businessId != null ? { businessId } : {}),
              ...(statusFilter !== undefined ? { status: statusFilter } : {}),
              ...(q && {
                OR: [
                  { estimateNumber: { contains: q, mode: 'insensitive' } },
                  { client: { name: { contains: q, mode: 'insensitive' } } },
                  { client: { businessName: { contains: q, mode: 'insensitive' } } },
                ],
              }),
            };
            total = await prisma.estimate.count({ where });
            break;
          }
          case 'expenses': {
            label = 'expenses';
            const where: Prisma.ExpenseWhereInput = {
              workspaceId,
              ...(q && {
                OR: [
                  { merchant: { name: { contains: q, mode: 'insensitive' } } },
                  { description: { contains: q, mode: 'insensitive' } },
                ],
              }),
            };
            total = await prisma.expense.count({ where });
            break;
          }
          case 'catalog': {
            label = 'catalog products';
            const where: Prisma.CatalogWhereInput = {
              workspaceId,
              ...(businessId != null ? { businessId } : {}),
              ...(q && {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                ],
              }),
            };
            total = await prisma.catalog.count({ where });
            break;
          }
          default:
            throw new llm.ToolError('Unsupported entity type.');
        }

        return `You have ${total} ${label} matching that filter.`;
      } catch (error) {
        console.error('[tool][countEntities] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to count records.',
        );
      }
    },
  });

  const listInvoicesPage = llm.tool({
    description:
      'List invoices with pagination. Optional filters: business, status, search. Use for browsing invoices (not the same as unpaid-only payment helper).',
    parameters: z.object({
      page: z.number().int().min(1).optional().default(PAGE_DEFAULT),
      limit: z.number().int().min(1).max(LIMIT_MAX_INVOICES).optional().default(LIMIT_DEFAULT),
      businessId: z.number().int().optional().nullable(),
      status: invoiceStatusZ.optional().nullable(),
      search: z.string().trim().optional().nullable(),
    }),
    execute: async (
      { page = PAGE_DEFAULT, limit: limitParam, businessId: bid, status, search },
      { ctx },
    ) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const businessId = resolveBusinessId(sessionData, bid ?? undefined);
        const limit = clampLimit(limitParam, LIMIT_MAX_INVOICES);
        const skip = (page - 1) * limit;
        const q = search?.trim() || undefined;

        console.log(
          `[tool][listInvoicesPage] workspaceId=${workspaceId} page=${page} limit=${limit} businessId=${businessId ?? 'none'}`,
        );

        const where: Prisma.InvoiceWhereInput = {
          workspaceId,
          ...(q && {
            OR: [
              { invoiceNumber: { contains: q, mode: 'insensitive' } },
              { client: { name: { contains: q, mode: 'insensitive' } } },
              { client: { businessName: { contains: q, mode: 'insensitive' } } },
            ],
          }),
          ...(status && { status }),
          ...(businessId != null ? { businessId } : {}),
        };

        const [rows, total] = await Promise.all([
          prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              invoiceNumber: true,
              status: true,
              total: true,
              balance: true,
              issueDate: true,
              client: { select: { name: true } },
              business: { select: { name: true } },
            },
          }),
          prisma.invoice.count({ where }),
        ]);

        if (rows.length === 0) {
          return page === 1
            ? 'No invoices match that filter.'
            : `No invoices on page ${page}. Total matching: ${total}.`;
        }

        const parts = rows.map(
          (inv) =>
            `Invoice ${inv.invoiceNumber}, status ${inv.status}, total ${money(Number(inv.total))}, balance ${money(Number(inv.balance))}, client ${inv.client?.name ?? 'unknown'}`,
        );
        const hasMore = page * limit < total;
        return (
          `Showing ${rows.length} of ${total} invoices, page ${page}. ` +
          parts.join('. ') +
          (hasMore ? ' Say next page for more.' : '')
        );
      } catch (error) {
        console.error('[tool][listInvoicesPage] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to list invoices.',
        );
      }
    },
  });

  const listEstimatesPage = llm.tool({
    description: 'List estimates with pagination and optional business, status, or search filters.',
    parameters: z.object({
      page: z.number().int().min(1).optional().default(PAGE_DEFAULT),
      limit: z.number().int().min(1).max(LIMIT_MAX_ESTIMATES).optional().default(LIMIT_DEFAULT),
      businessId: z.number().int().optional().nullable(),
      status: estimateStatusZ.optional().nullable(),
      search: z.string().trim().optional().nullable(),
    }),
    execute: async (
      { page = PAGE_DEFAULT, limit: limitParam, businessId: bid, status, search },
      { ctx },
    ) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const businessId = resolveBusinessId(sessionData, bid ?? undefined);
        const limit = clampLimit(limitParam, LIMIT_MAX_ESTIMATES);
        const skip = (page - 1) * limit;
        const q = search?.trim() || undefined;

        console.log(
          `[tool][listEstimatesPage] workspaceId=${workspaceId} page=${page} limit=${limit}`,
        );

        const where: Prisma.EstimateWhereInput = {
          workspaceId,
          ...(q && {
            OR: [
              { estimateNumber: { contains: q, mode: 'insensitive' } },
              { client: { name: { contains: q, mode: 'insensitive' } } },
              { client: { businessName: { contains: q, mode: 'insensitive' } } },
            ],
          }),
          ...(status && { status }),
          ...(businessId != null ? { businessId } : {}),
        };

        const [rows, total] = await Promise.all([
          prisma.estimate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
              estimateNumber: true,
              status: true,
              total: true,
              client: { select: { name: true } },
            },
          }),
          prisma.estimate.count({ where }),
        ]);

        if (rows.length === 0) {
          return page === 1
            ? 'No estimates match that filter.'
            : `No estimates on page ${page}. Total matching: ${total}.`;
        }

        const parts = rows.map(
          (e) =>
            `Estimate ${e.estimateNumber}, status ${e.status}, total ${money(Number(e.total))}, client ${e.client?.name ?? 'unknown'}`,
        );
        const hasMore = page * limit < total;
        return (
          `Showing ${rows.length} of ${total} estimates, page ${page}. ` +
          parts.join('. ') +
          (hasMore ? ' Say next page for more.' : '')
        );
      } catch (error) {
        console.error('[tool][listEstimatesPage] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to list estimates.',
        );
      }
    },
  });

  const listClientsPage = llm.tool({
    description:
      'List clients with pagination and optional search (name, email, phone, business name).',
    parameters: z.object({
      page: z.number().int().min(1).optional().default(PAGE_DEFAULT),
      limit: z.number().int().min(1).max(LIMIT_MAX_CLIENTS).optional().default(LIMIT_DEFAULT),
      search: z.string().trim().optional().nullable(),
    }),
    execute: async ({ page = PAGE_DEFAULT, limit: limitParam, search }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const limit = clampLimit(limitParam, LIMIT_MAX_CLIENTS);
        const skip = (page - 1) * limit;
        const q = search?.trim() || undefined;

        console.log(`[tool][listClientsPage] workspaceId=${workspaceId} page=${page}`);

        const where: Prisma.ClientWhereInput = {
          workspaceId,
          ...(q && {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { businessName: { contains: q, mode: 'insensitive' } },
            ],
          }),
        };

        const [rows, total] = await Promise.all([
          prisma.client.findMany({
            where,
            orderBy: { sequence: 'asc' },
            skip,
            take: limit,
            select: { name: true, email: true, sequence: true },
          }),
          prisma.client.count({ where }),
        ]);

        if (rows.length === 0) {
          return page === 1
            ? 'No clients match that filter.'
            : `No clients on page ${page}. Total: ${total}.`;
        }

        const parts = rows.map(
          (c) => `Client number ${c.sequence}, ${c.name}, email ${c.email ?? 'none'}`,
        );
        const hasMore = page * limit < total;
        return (
          `Showing ${rows.length} of ${total} clients, page ${page}. ` +
          parts.join('. ') +
          (hasMore ? ' Say next page for more.' : '')
        );
      } catch (error) {
        console.error('[tool][listClientsPage] failed', error);
        throw new llm.ToolError(error instanceof Error ? error.message : 'Failed to list clients.');
      }
    },
  });

  const listExpensesPage = llm.tool({
    description:
      'List expenses with pagination. Optional search, date range (YYYY-MM-DD), merchant id, or work category id. Expenses are workspace-wide.',
    parameters: z.object({
      page: z.number().int().min(1).optional().default(PAGE_DEFAULT),
      limit: z.number().int().min(1).max(LIMIT_MAX_EXPENSES).optional().default(LIMIT_DEFAULT),
      search: z.string().trim().optional().nullable(),
      dateFrom: z.string().trim().optional().nullable().describe('Start date YYYY-MM-DD'),
      dateTo: z.string().trim().optional().nullable().describe('End date YYYY-MM-DD'),
      merchantId: z.number().int().optional().nullable(),
      workCategoryId: z.number().int().optional().nullable(),
    }),
    execute: async (
      {
        page = PAGE_DEFAULT,
        limit: limitParam,
        search,
        dateFrom,
        dateTo,
        merchantId,
        workCategoryId,
      },
      { ctx },
    ) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const limit = clampLimit(limitParam, LIMIT_MAX_EXPENSES);
        const skip = (page - 1) * limit;
        const q = search?.trim() || undefined;

        const expenseDateFilter: Prisma.ExpenseWhereInput['expenseDate'] =
          dateFrom && dateTo
            ? { gte: new Date(dateFrom), lte: new Date(dateTo) }
            : dateFrom
              ? { gte: new Date(dateFrom) }
              : dateTo
                ? { lte: new Date(dateTo) }
                : undefined;

        console.log(`[tool][listExpensesPage] workspaceId=${workspaceId} page=${page}`);

        const where: Prisma.ExpenseWhereInput = {
          workspaceId,
          ...(q && {
            OR: [
              { merchant: { name: { contains: q, mode: 'insensitive' } } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }),
          ...(expenseDateFilter && { expenseDate: expenseDateFilter }),
          ...(merchantId != null && { merchantId }),
          ...(workCategoryId != null && { workCategoryId }),
        };

        const [rows, total] = await Promise.all([
          prisma.expense.findMany({
            where,
            orderBy: { sequence: 'desc' },
            skip,
            take: limit,
            select: {
              sequence: true,
              total: true,
              expenseDate: true,
              description: true,
              merchant: { select: { name: true } },
            },
          }),
          prisma.expense.count({ where }),
        ]);

        if (rows.length === 0) {
          return page === 1
            ? 'No expenses match that filter.'
            : `No expenses on page ${page}. Total matching: ${total}.`;
        }

        const parts = rows.map((e) => {
          const desc = e.description?.slice(0, 60) ?? '';
          return `Expense ${e.sequence}, amount ${money(Number(e.total))}, date ${e.expenseDate.toISOString().slice(0, 10)}, merchant ${e.merchant?.name ?? 'none'}${desc ? `, ${desc}` : ''}`;
        });
        const hasMore = page * limit < total;
        return (
          `Showing ${rows.length} of ${total} expenses, page ${page}. ` +
          parts.join('. ') +
          (hasMore ? ' Say next page for more.' : '')
        );
      } catch (error) {
        console.error('[tool][listExpensesPage] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to list expenses.',
        );
      }
    },
  });

  const listCatalogPage = llm.tool({
    description:
      'List catalog (product) items with pagination. Optional business filter and search. Sort by sequence, name, or price.',
    parameters: z.object({
      page: z.number().int().min(1).optional().default(PAGE_DEFAULT),
      limit: z.number().int().min(1).max(LIMIT_MAX_CATALOG).optional().default(LIMIT_DEFAULT),
      businessId: z.number().int().optional().nullable(),
      search: z.string().trim().optional().nullable(),
      sortBy: catalogSortByZ.optional().default('sequence'),
      sortOrder: catalogSortOrderZ.optional().default('asc'),
    }),
    execute: async (
      {
        page = PAGE_DEFAULT,
        limit: limitParam,
        businessId: bid,
        search,
        sortBy = 'sequence',
        sortOrder = 'asc',
      },
      { ctx },
    ) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        const workspaceId = sessionData.workspaceId;
        const businessId = resolveBusinessId(sessionData, bid ?? undefined);
        const limit = clampLimit(limitParam, LIMIT_MAX_CATALOG);
        const skip = (page - 1) * limit;
        const q = search?.trim() || undefined;

        console.log(`[tool][listCatalogPage] workspaceId=${workspaceId} page=${page}`);

        const where: Prisma.CatalogWhereInput = {
          workspaceId,
          ...(businessId != null ? { businessId } : {}),
          ...(q && {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }),
        };

        const orderBy = { [sortBy]: sortOrder } as Prisma.CatalogOrderByWithRelationInput;

        const [rows, total] = await Promise.all([
          prisma.catalog.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: { name: true, price: true, sequence: true, description: true },
          }),
          prisma.catalog.count({ where }),
        ]);

        if (rows.length === 0) {
          return page === 1
            ? 'No catalog products match that filter.'
            : `No products on page ${page}. Total matching: ${total}.`;
        }

        const parts = rows.map(
          (c) => `Product ${c.name}, price ${money(Number(c.price))}, sequence ${c.sequence}`,
        );
        const hasMore = page * limit < total;
        return (
          `Showing ${rows.length} of ${total} products, page ${page}. ` +
          parts.join('. ') +
          (hasMore ? ' Say next page for more.' : '')
        );
      } catch (error) {
        console.error('[tool][listCatalogPage] failed', error);
        throw new llm.ToolError(
          error instanceof Error ? error.message : 'Failed to list catalog products.',
        );
      }
    },
  });

  return {
    getFinancialSummary,
    countEntities,
    listInvoicesPage,
    listEstimatesPage,
    listClientsPage,
    listExpensesPage,
    listCatalogPage,
  };
}
