import type { Prisma } from "@addinvoice/db";

import type { CatalogEntity } from "./catalog.schemas.js";

import { toJsonRecord } from "../../core/prisma-json.js";
import { toBusinessEntity } from "../businesses/businesses.mapper.js";

type CatalogRowWithBusiness = Prisma.CatalogGetPayload<{
  include: { business: true };
}>;

/**
 * Map a Prisma `Catalog` row (with its business relation) into the
 * `CatalogEntity` response shape. Decimal `price` becomes a number, and the
 * JSON `description` is narrowed to `JsonRecord`.
 *
 * If the JSON is anything other than an object (which the schema rejects on
 * the way in), we fall back to an empty object so the response stays
 * structurally valid; this should never happen in practice.
 */
export function toCatalogEntity(row: CatalogRowWithBusiness): CatalogEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    businessId: row.businessId,
    name: row.name,
    description: toJsonRecord(row.description) ?? {},
    price: Number(row.price),
    quantityUnit: row.quantityUnit,
    business: toBusinessEntity(row.business),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
