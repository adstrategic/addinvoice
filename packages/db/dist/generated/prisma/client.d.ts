import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class";
import * as Prisma from "./internal/prismaNamespace";
export * as $Enums from './enums';
export * from "./enums";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Workspaces
 * const workspaces = await prisma.workspace.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model Workspace
 *
 */
export type Workspace = Prisma.WorkspaceModel;
/**
 * Model Client
 *
 */
export type Client = Prisma.ClientModel;
/**
 * Model Catalog
 *
 */
export type Catalog = Prisma.CatalogModel;
/**
 * Model WorkspacePaymentMethod
 *
 */
export type WorkspacePaymentMethod = Prisma.WorkspacePaymentMethodModel;
/**
 * Model Invoice
 *
 */
export type Invoice = Prisma.InvoiceModel;
/**
 * Model InvoiceItem
 *
 */
export type InvoiceItem = Prisma.InvoiceItemModel;
/**
 * Model Payment
 *
 */
export type Payment = Prisma.PaymentModel;
/**
 * Model Estimate
 *
 */
export type Estimate = Prisma.EstimateModel;
/**
 * Model EstimateItem
 *
 */
export type EstimateItem = Prisma.EstimateItemModel;
/**
 * Model Business
 *
 */
export type Business = Prisma.BusinessModel;
//# sourceMappingURL=client.d.ts.map