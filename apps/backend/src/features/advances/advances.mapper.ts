import type { Prisma } from "@addinvoice/db";
import type {
  AdvanceListItemResponse,
  AdvanceResponse,
} from "@addinvoice/schemas";

import { toJsonRecord } from "../../core/prisma-json.js";
import { toBusinessEntity } from "../businesses/businesses.mapper.js";

type AdvanceRowWithRelations = Prisma.AdvanceGetPayload<{
  include: { attachments: true; business: true; client: true };
}>;

type AdvanceRowListWithRelations = Prisma.AdvanceGetPayload<{
  include: { business: true; client: true };
}>;

/**
 * Map a Prisma `Advance` row (with attachments + business + client) into the
 * `AdvanceResponse` shape. JSON `workCompleted` is narrowed via `toJsonRecord`,
 * the optional `business` is mapped through the shared business mapper.
 */
export function toAdvanceResponse(
  row: AdvanceRowWithRelations,
): AdvanceResponse {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    status: row.status,
    projectName: row.projectName,
    advanceDate: row.advanceDate,
    location: row.location,
    workCompleted: toJsonRecord(row.workCompleted),
    invoiceId: row.invoiceId,
    businessId: row.businessId,
    clientId: row.clientId,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      advanceId: attachment.advanceId,
      url: attachment.url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sequence: attachment.sequence,
      createdAt: attachment.createdAt,
    })),
    business: row.business ? toBusinessEntity(row.business) : null,
    client: row.client,
  };
}

/**
 * List variant: same as `toAdvanceResponse` but without attachments. Mirrors
 * `advanceListItemResponseSchema = advanceResponseSchema.omit({ attachments })`.
 */
export function toAdvanceListItem(
  row: AdvanceRowListWithRelations,
): AdvanceListItemResponse {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    status: row.status,
    projectName: row.projectName,
    advanceDate: row.advanceDate,
    location: row.location,
    workCompleted: toJsonRecord(row.workCompleted),
    invoiceId: row.invoiceId,
    businessId: row.businessId,
    clientId: row.clientId,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    business: row.business ? toBusinessEntity(row.business) : null,
    client: row.client,
  };
}
