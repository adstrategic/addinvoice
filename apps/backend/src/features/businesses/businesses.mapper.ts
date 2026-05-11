import type { Prisma } from "@addinvoice/db";
import type { BusinessResponse } from "@addinvoice/schemas";

import { toJsonRecord } from "../../core/prisma-json.js";

/**
 * Prisma row shape this mapper accepts. We deliberately use
 * `Prisma.BusinessGetPayload<{}>` (no includes) because the canonical business
 * response is the flat shape; relations are layered by feature-specific
 * mappers (catalog, advances, estimates, etc.) on top of this one.
 */
type BusinessRow = Prisma.BusinessGetPayload<Record<string, never>>;

/**
 * Convert a Prisma `Business` row into the canonical `BusinessResponse` shape
 * shared between backend and frontend (`@addinvoice/schemas`):
 *  - `Decimal` `defaultTaxPercentage` is normalised to `number | null`.
 *  - `JsonValue` `defaultNotes` / `defaultTerms` are narrowed to
 *    `JsonRecord | null` (any non-object JSON falls back to `null`).
 *
 * The return type is the strictest available (no `| undefined` on string
 * fields), which keeps it assignable both to `BusinessResponse` (estimates,
 * advances) and the backend-local `BusinessEntity` alias.
 */
export function toBusinessEntity(row: BusinessRow): BusinessResponse {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    nit: row.nit,
    logo: row.logo,
    isDefault: row.isDefault,
    defaultTaxMode: row.defaultTaxMode,
    defaultTaxName: row.defaultTaxName,
    defaultTaxPercentage:
      row.defaultTaxPercentage != null
        ? Number(row.defaultTaxPercentage)
        : null,
    defaultNotes: toJsonRecord(row.defaultNotes),
    defaultTerms: toJsonRecord(row.defaultTerms),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
