import type { Prisma } from "@addinvoice/db";
import type {
  ProposalDashboardResponse,
  ProposalDescriptiveItemResponse,
  ProposalResponse,
} from "@addinvoice/schemas";

import { toJsonRecord } from "../../core/prisma-json.js";
import { toBusinessEntity } from "../businesses/businesses.mapper.js";

type ProposalDescriptiveItemRow =
  Prisma.ProposalDescriptiveItemGetPayload<Record<string, never>>;

type ProposalRowWithRelations = Prisma.ProposalGetPayload<{
  include: {
    business: true;
    client: true;
    descriptiveItems: true;
  };
}>;

type ProposalRowDashboard = Prisma.ProposalGetPayload<{
  include: {
    business: true;
    client: true;
    _count: { select: { descriptiveItems: true } };
  };
}>;

type ProposalRowFlat = Prisma.ProposalGetPayload<{
  include: { business: true; client: true };
}>;

/**
 * Map a Prisma `ProposalDescriptiveItem` row to the API response shape.
 */
export function toProposalDescriptiveItemResponse(
  row: ProposalDescriptiveItemRow,
): ProposalDescriptiveItemResponse {
  return {
    id: row.id,
    proposalId: row.proposalId,
    title: row.title,
    description: toJsonRecord(row.description) ?? {},
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Shared core for the proposal response mappers below.
 * Pulls out every field that is independent of which relations are loaded.
 */
function toProposalBase(row: ProposalRowFlat) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    estimateId: row.estimateId,
    businessId: row.businessId,
    clientId: row.clientId,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    clientAddress: row.clientAddress,
    proposalNumber: row.proposalNumber,
    purchaseOrder: row.purchaseOrder,
    status: row.status,
    currency: row.currency,
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
    voidedAt: row.voidedAt,
    acceptedAt: row.acceptedAt,
    acceptedBy: row.acceptedBy,
    convertedToInvoiceId: row.convertedToInvoiceId,
    selectedPaymentMethodId: row.selectedPaymentMethodId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    business: toBusinessEntity(row.business),
    client: row.client,
  };
}

/**
 * Map a Prisma `Proposal` row with full relations into the canonical
 * `ProposalResponse` shape.
 */
export function toProposalResponse(
  row: ProposalRowWithRelations,
): ProposalResponse {
  return {
    ...toProposalBase(row),
    descriptiveItems: row.descriptiveItems.map(
      toProposalDescriptiveItemResponse,
    ),
  };
}

/**
 * Map a Prisma `Proposal` row when only `business` and `client` are loaded
 * (e.g. status transitions that don't refetch descriptive items).
 */
export function toProposalResponseWithoutItems(
  row: ProposalRowFlat,
): ProposalResponse {
  return toProposalBase(row);
}

/**
 * Map a Prisma `Proposal` row used by the dashboard listing — includes
 * `_count.descriptiveItems` to drive the listing without loading items.
 */
export function toProposalDashboardResponse(
  row: ProposalRowDashboard,
): ProposalDashboardResponse {
  const { _count, ...rest } = row;
  return {
    ...toProposalBase(rest),
    descriptiveItemCount: _count.descriptiveItems,
  };
}
