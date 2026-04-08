/**
 * Client-safe entry: only Prisma-generated enums.
 * Use this in frontend and in @addinvoice/schemas so the bundle never pulls in pg/Prisma client.
 */
export * from "./generated/prisma/enums.js";
