import { llm } from '@livekit/agents';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type {
  EstimateDraft,
  InvoiceSessionData,
  LineItemDraft,
  QuantityUnit,
} from '../types/session-data';

function parseDateOnlyUtc(dateStr: string): Date {
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) {
    throw new Error('Invalid date format');
  }

  const year = parseInt(dateParts[0]!, 10);
  const month = parseInt(dateParts[1]!, 10) - 1;
  const day = parseInt(dateParts[2]!, 10);

  const parsed = new Date(Date.UTC(year, month, day));
  if (isNaN(parsed.getTime())) throw new Error('Invalid date');
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

async function getNextEstimateNumber(workspaceId: number, businessId: number): Promise<string> {
  const lastEstimate = await prisma.estimate.findFirst({
    where: { workspaceId, businessId },
    orderBy: { estimateNumber: 'desc' },
    select: { estimateNumber: true },
  });

  if (!lastEstimate) return 'EST-0001';

  const prefixMatch = /^[^0-9]*/.exec(lastEstimate.estimateNumber);
  const preservedPrefix = prefixMatch ? prefixMatch[0] : 'EST-';

  const matches = lastEstimate.estimateNumber.match(/\d+/g);
  const extracted = matches && matches.length > 0 ? parseInt(matches.at(-1)!, 10) : null;
  const nextNumber = extracted != null && !isNaN(extracted) ? extracted + 1 : 1;
  const padded = nextNumber.toString().padStart(4, '0');
  return `${preservedPrefix}${padded}`;
}

function generateEstimateIdempotencyKey(
  draft: NonNullable<InvoiceSessionData['currentEstimate']>,
  estimateDate: string,
  expiryDate?: string | null,
): string {
  const content = JSON.stringify({
    clientId: draft.clientId,
    businessId: draft.businessId,
    items: draft.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      quantityUnit: item.quantityUnit,
    })),
    estimateDate,
    expiryDate: expiryDate ?? null,
  });

  return createHash('sha256').update(content).digest('hex');
}

function initEstimateDraft(sessionData: InvoiceSessionData): EstimateDraft {
  const businessId = sessionData.selectedBusinessId;
  return {
    ...(businessId ? { businessId } : {}),
    items: [],
    subtotal: 0,
    totalTax: 0,
    discount: 0,
    total: 0,
    currency: 'USD',
    requireSignature: false,
  };
}

export function createAddEstimateItemTool() {
  return llm.tool({
    description: 'Add a line item to the current estimate draft being created',
    parameters: z.object({
      description: z.string().trim().min(1).describe('Description of the product or service'),
      quantity: z.number().describe('Quantity of items'),
      unitPrice: z.number().describe('Price per unit in dollars'),
      quantityUnit: z
        .enum(['DAYS', 'HOURS', 'UNITS'])
        .describe('Unit of measurement for quantity. Defaults to UNITS if not specified.')
        .optional(),
    }),
    execute: async ({ description, quantity, unitPrice, quantityUnit }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        if (!sessionData.selectedBusinessId && !sessionData.currentEstimate?.businessId) {
          throw new llm.ToolError('No business selected. Please select a business first.');
        }

        if (!sessionData.currentEstimate) {
          sessionData.currentEstimate = initEstimateDraft(sessionData);
        }

        const draft = sessionData.currentEstimate;
        const items = draft.items;

        const effectiveQuantityUnit: QuantityUnit = quantityUnit ?? 'UNITS';
        const descNorm = description.toLowerCase();

        const isDuplicate = items.some(
          (existingItem) =>
            existingItem.description.trim().toLowerCase() === descNorm &&
            existingItem.quantity === quantity &&
            existingItem.unitPrice === unitPrice &&
            existingItem.quantityUnit === effectiveQuantityUnit,
        );

        if (isDuplicate) {
          return {
            success: true,
            itemNumber: items.length,
            itemTotal: (quantity * unitPrice).toFixed(2),
            runningTotal: draft.total.toFixed(2),
            message: `Item already added. Current total: $${draft.total.toFixed(2)}`,
          };
        }

        const itemTotal = quantity * unitPrice;
        const item: LineItemDraft = {
          name: description,
          description,
          quantity,
          quantityUnit: effectiveQuantityUnit,
          unitPrice,
          discount: 0,
          discountType: 'NONE',
          tax: 0,
          vatEnabled: false,
          total: itemTotal,
        };

        items.push(item);

        const effectiveBusinessId = draft.businessId ?? sessionData.selectedBusinessId;
        let effectiveTaxMode: 'BY_PRODUCT' | 'BY_TOTAL' | 'NONE' = 'NONE';
        let effectiveTaxPercentage = 0;

        if (effectiveBusinessId) {
          const business = await prisma.business.findFirst({
            where: { id: effectiveBusinessId, workspaceId: sessionData.workspaceId },
            select: { defaultTaxMode: true, defaultTaxPercentage: true },
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

        draft.subtotal = items.reduce((sum, i) => sum + i.total, 0);

        let totalTax = 0;
        if (effectiveTaxMode === 'BY_TOTAL') {
          totalTax = items.reduce(
            (sum, i) => sum + (i.vatEnabled ? i.total : 0) * (effectiveTaxPercentage / 100),
            0,
          );
        } else if (effectiveTaxMode === 'BY_PRODUCT') {
          totalTax = items.reduce((sum, i) => sum + i.total * (i.tax / 100), 0);
        }

        draft.totalTax = totalTax;
        draft.total = draft.subtotal + draft.totalTax;

        return {
          success: true,
          itemNumber: items.length,
          itemTotal: itemTotal.toFixed(2),
          runningTotal: draft.total.toFixed(2),
          message: `Added item ${items.length}. Current total: $${draft.total.toFixed(2)}`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to add estimate item. Please try again.');
      }
    },
  });
}

export function createCreateEstimateTool() {
  return llm.tool({
    description:
      'Save the complete estimate draft to the database after all details are confirmed.',
    parameters: z.object({
      estimateDate: z
        .string()
        .nullish()
        .describe('Estimate date in YYYY-MM-DD format. If omitted, today is used.'),
      expiryDate: z
        .string()
        .nullish()
        .describe('Estimate expiry date in YYYY-MM-DD format (timeline end). Leave empty to omit.'),
      notes: z.string().trim().max(2000).nullish(),
      currency: z.string().trim().min(1).max(10).nullish(),
      terms: z.string().trim().max(2000).nullish(),
      summary: z.string().trim().max(2000).nullish(),
    }),
    execute: async ({ estimateDate, expiryDate, notes, currency, terms, summary }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        if (!sessionData.currentEstimate) {
          throw new llm.ToolError(
            'No estimate draft to create. Please start by selecting a customer and adding items.',
          );
        }

        const draft = sessionData.currentEstimate;

        if (!draft.clientId) {
          throw new llm.ToolError('No client selected. Please select a client first.');
        }

        const effectiveBusinessId = draft.businessId ?? sessionData.selectedBusinessId;
        if (!effectiveBusinessId) {
          throw new llm.ToolError(
            'No business selected. Please select a business first using selectBusiness.',
          );
        }

        if (draft.items.length === 0) {
          throw new llm.ToolError('Cannot create estimate without line items.');
        }

        const resolvedEstimateDate = estimateDate ? parseDateOnlyUtc(estimateDate) : undefined;
        const resolvedExpiryDate = expiryDate ? parseDateOnlyUtc(expiryDate) : undefined;

        const now = new Date();
        const estimateStartDate =
          resolvedEstimateDate ??
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        estimateStartDate.setUTCHours(0, 0, 0, 0);

        const idempotencyKey = generateEstimateIdempotencyKey(
          draft,
          estimateDate ?? estimateStartDate.toISOString().slice(0, 10),
          expiryDate ?? null,
        );

        if (sessionData.lastCreatedEstimate?.idempotencyKey === idempotencyKey) {
          const cached = sessionData.lastCreatedEstimate;
          const existing = await prisma.estimate.findUnique({
            where: { id: cached.id },
            select: { id: true, estimateNumber: true, total: true },
          });
          if (existing) {
            return {
              success: true,
              estimateId: existing.id,
              estimateNumber: existing.estimateNumber,
              total: existing.total.toString(),
              message: `Estimate ${existing.estimateNumber} already created. Total: $${existing.total}`,
            };
          }
        }

        const business = await prisma.business.findFirst({
          where: { id: effectiveBusinessId, workspaceId: sessionData.workspaceId },
          select: {
            id: true,
            defaultTaxMode: true,
            defaultTaxName: true,
            defaultTaxPercentage: true,
            defaultNotes: true,
            defaultTerms: true,
          },
        });

        if (!business)
          throw new llm.ToolError('Selected business not found. Please select a business again.');

        const client = await prisma.client.findUnique({
          where: { id: draft.clientId },
        });

        if (!client)
          throw new llm.ToolError('Selected client not found. Please select a client again.');

        const taxMode = business.defaultTaxMode ?? 'NONE';
        const taxName = taxMode === 'BY_TOTAL' ? business.defaultTaxName : null;
        const taxPercentage =
          taxMode === 'BY_TOTAL' && business.defaultTaxPercentage != null
            ? Number(business.defaultTaxPercentage)
            : null;

        let totalTax = 0;
        if (taxMode === 'BY_TOTAL' && taxPercentage != null) {
          totalTax = draft.items.reduce(
            (sum, i) => sum + (i.vatEnabled ? i.total : 0) * (taxPercentage / 100),
            0,
          );
        } else if (taxMode === 'BY_PRODUCT') {
          totalTax = draft.items.reduce((sum, i) => sum + i.total * (i.tax / 100), 0);
        }

        const subtotal = draft.items.reduce((sum, i) => sum + i.total, 0);
        const total = subtotal + totalTax;

        const lastEstimate = await prisma.estimate.findFirst({
          where: { workspaceId: sessionData.workspaceId },
          orderBy: { sequence: 'desc' },
          select: { sequence: true },
        });
        const nextSequence = (lastEstimate?.sequence || 0) + 1;

        const estimateNumber = await getNextEstimateNumber(
          sessionData.workspaceId,
          effectiveBusinessId,
        );

        const estimate = await prisma.estimate.create({
          data: {
            workspaceId: sessionData.workspaceId,
            businessId: business.id,
            clientId: draft.clientId,
            clientEmail: client.email,
            clientPhone: client.phone ?? null,
            clientAddress: client.address ?? null,
            summary: summary ?? null,
            timelineStartDate: estimateStartDate,
            timelineEndDate: resolvedExpiryDate ?? null,
            sequence: nextSequence,
            estimateNumber,
            status: 'DRAFT',
            currency: currency ?? draft.currency ?? 'USD',
            subtotal,
            totalTax,
            discount: 0,
            discountType: 'NONE',
            taxMode,
            taxName,
            taxPercentage,
            total,
            notes: notes ?? business.defaultNotes ?? null,
            terms: terms ?? business.defaultTerms ?? null,
            purchaseOrder: null,
            requireSignature: false,
            items: {
              create: draft.items.map((i) => ({
                name: i.name,
                description: i.description,
                quantity: i.quantity,
                quantityUnit: i.quantityUnit,
                unitPrice: i.unitPrice,
                discount: i.discount,
                discountType: i.discountType,
                tax: i.tax,
                vatEnabled: i.vatEnabled,
                total: i.total,
                catalogId: null,
              })),
            },
          },
          include: { items: true, client: true, business: true },
        });

        sessionData.lastCreatedEstimate = {
          id: estimate.id,
          estimateNumber: estimate.estimateNumber,
          total: Number(estimate.total),
          createdAt: Date.now(),
          idempotencyKey,
        };

        sessionData.currentEstimate = null;

        return {
          success: true,
          estimateId: estimate.id,
          estimateNumber: estimate.estimateNumber,
          total: estimate.total.toString(),
          message: `Estimate ${estimate.estimateNumber} created successfully! Total: $${estimate.total}`,
        };
      } catch (error) {
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to create estimate. Please try again.');
      }
    },
  });
}
