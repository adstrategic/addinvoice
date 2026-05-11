import { Prisma } from "@addinvoice/db";

/**
 * Domain shape used in API response schemas for JSON columns.
 * Aligned with `z.record(z.string(), z.unknown())` from `@addinvoice/schemas`.
 */
export type JsonRecord = Record<string, unknown>;

/**
 * Cast a Prisma `JsonValue` (read side) to the `JsonRecord` shape used by
 * response schemas. Anything that isn't a plain JSON object (string, number,
 * boolean, array, db-null) collapses to `null`.
 *
 * Two overloads keep the return type tight at the call site: a value that
 * Prisma typed as non-nullable comes back as `JsonRecord | null` (we still
 * can't statically prove the column is an object), while a nullable value
 * keeps its `| null`.
 */
export function toJsonRecord(value: Prisma.JsonValue): JsonRecord | null;
export function toJsonRecord(
  value: Prisma.JsonValue | null,
): JsonRecord | null;
export function toJsonRecord(
  value: Prisma.JsonValue | null,
): JsonRecord | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

/**
 * Convert a domain JSON value into the input shape expected by Prisma for a
 * nullable `Json?` column.
 *
 * Plain `null`/`undefined` are not assignable to Prisma's nullable Json input;
 * Prisma uses the `Prisma.JsonNull` sentinel to write a SQL `NULL`. This helper
 * normalises that conversion in one place.
 *
 * Accepts the canonical domain shape (`JsonRecord`) as well as raw
 * `Prisma.JsonValue` (useful when copying an existing row's JSON to another).
 */
export function toNullableJsonInput(
  value: JsonRecord | Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value == null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

/**
 * Convert a domain JSON value into the input shape expected by Prisma for a
 * required (non-nullable) `Json` column.
 *
 * Accepts either the canonical domain shape (`JsonRecord`) or a `JsonValue`
 * from a Prisma read — useful when copying a non-nullable JSON column from
 * one row to another (e.g. estimate item → invoice item) without going
 * through the request schema.
 *
 * Required Json columns reject SQL `null` at the type level; passing `null`
 * here is a programming error.
 */
export function toJsonInput(
  value: JsonRecord | Prisma.JsonValue,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
