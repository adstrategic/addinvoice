/**
 * Re-export Prisma client and all generated types from @addinvoice/db.
 * Consumers (backend, agent) import from "@addinvoice/db" instead of the generated path.
 */
export * from "./generated/prisma/client";
