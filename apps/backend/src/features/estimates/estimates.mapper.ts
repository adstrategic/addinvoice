import type { Prisma } from "@addinvoice/db";
import type {
  EstimateDashboardResponse,
  EstimateDescriptiveItemResponse,
  EstimateItemResponse,
  EstimateResponse,
} from "@addinvoice/schemas";

import { toJsonRecord } from "../../core/prisma-json.js";
import { toBusinessEntity } from "../businesses/businesses.mapper.js";

type EstimateItemRow = Prisma.EstimateItemGetPayload<Record<string, never>>;
type EstimateDescriptiveItemRow = Prisma.EstimateDescriptiveItemGetPayload<
  Record<string, never>
>;

type EstimateRowWithRelations = Prisma.EstimateGetPayload<{
  include: {
    business: true;
    client: true;
    descriptiveItems: true;
    items: true;
    proposal: { select: { sequence: true } };
  };
}>;

type EstimateRowDashboard = Prisma.EstimateGetPayload<{
  include: {
    _count: { select: { items: true } };
    business: true;
    client: true;
    proposal: { select: { sequence: true } };
  };
}>;

type EstimateRowFlat = Prisma.EstimateGetPayload<{
  include: { business: true; client: true };
}>;

/**
 * Map a Prisma `EstimateItem` row to the API `EstimateItemResponse`.
 * Decimal columns become numbers and the JSON `description` is narrowed.
 */
export function toEstimateItemResponse(
  row: EstimateItemRow,
): EstimateItemResponse {
  return {
    id: row.id,
    estimateId: row.estimateId,
    catalogId: row.catalogId,
    name: row.name,
    description: toJsonRecord(row.description) ?? {},
    quantity: Number(row.quantity),
    quantityUnit: row.quantityUnit,
    unitPrice: Number(row.unitPrice),
    discount: Number(row.discount),
    discountType: row.discountType,
    tax: Number(row.tax),
    vatEnabled: row.vatEnabled,
    total: Number(row.total),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toEstimateDescriptiveItemResponse(
  row: EstimateDescriptiveItemRow,
): EstimateDescriptiveItemResponse {
  return {
    id: row.id,
    estimateId: row.estimateId,
    title: row.title,
    description: toJsonRecord(row.description) ?? {},
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Shared core for the estimate response mappers below.
 * Pulls out every field that is independent of which relations are loaded.
 */
function toEstimateBase(row: EstimateRowFlat) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    businessId: row.businessId,
    clientId: row.clientId,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    clientAddress: row.clientAddress,
    estimateNumber: row.estimateNumber,
    purchaseOrder: row.purchaseOrder,
    status: row.status,
    currency: row.currency,
    subtotal: Number(row.subtotal),
    totalTax: Number(row.totalTax),
    discount: Number(row.discount),
    discountType: row.discountType,
    taxMode: row.taxMode,
    taxName: row.taxName,
    taxPercentage:
      row.taxPercentage != null ? Number(row.taxPercentage) : null,
    total: Number(row.total),
    notes: toJsonRecord(row.notes),
    terms: toJsonRecord(row.terms),
    exclusions: toJsonRecord(row.exclusions),
    summary: toJsonRecord(row.summary),
    timelineStartDate: row.timelineStartDate,
    timelineEndDate: row.timelineEndDate,
    requireSignature: row.requireSignature,
    rejectionReason: row.rejectionReason,
    signingToken: row.signingToken,
    publicSlug: row.publicSlug,
    signatureData: row.signatureData as unknown,
    sentAt: row.sentAt,
    acceptedAt: row.acceptedAt,
    acceptedBy: row.acceptedBy,
    selectedPaymentMethodId: row.selectedPaymentMethodId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    business: toBusinessEntity(row.business),
    client: row.client,
  };
}

/**
 * Map a Prisma `Estimate` row with full relations into the canonical
 * `EstimateResponse` shape.
 */
export function toEstimateResponse(
  row: EstimateRowWithRelations,
): EstimateResponse {
  return {
    ...toEstimateBase(row),
    items: row.items.map(toEstimateItemResponse),
    descriptiveItems: row.descriptiveItems.map(
      toEstimateDescriptiveItemResponse,
    ),
    proposalSequence: row.proposal?.sequence ?? null,
  };
}

/**
 * Map a Prisma `Estimate` row when only `business` and `client` are loaded
 * (e.g. status transitions that don't refetch items).
 */
export function toEstimateResponseWithoutItems(
  row: EstimateRowFlat,
): EstimateResponse {
  return toEstimateBase(row);
}

/**
 * Map a Prisma `Estimate` row used by the dashboard listing — includes
 * `_count.items` to drive the "send" CTA without loading items.
 */
export function toEstimateDashboardResponse(
  row: EstimateRowDashboard,
): EstimateDashboardResponse {
  const { _count, proposal, ...rest } = row;
  return {
    ...toEstimateBase(rest),
    itemCount: _count.items,
    proposalSequence: proposal?.sequence ?? null,
  };
}
