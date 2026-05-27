import type { Prisma } from "@addinvoice/db";

import type { PaymentEntity } from "../payments/payments.schemas.js";
import type {
  InvoiceEntity,
  InvoiceEntityWithRelations,
  InvoiceItemEntity,
} from "./invoices.schemas.js";

import { toJsonRecord } from "../../core/prisma-json.js";
import { toBusinessEntity } from "../businesses/businesses.mapper.js";

type InvoiceItemRow = Prisma.InvoiceItemGetPayload<Record<string, never>>;
type PaymentRow = Prisma.PaymentGetPayload<Record<string, never>>;

type InvoiceRowFlat = Prisma.InvoiceGetPayload<Record<string, never>>;

type InvoiceRowWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    business: true;
    client: true;
    items: true;
    payments: true;
    selectedPaymentMethod: true;
  };
}>;

/**
 * Map a Prisma `InvoiceItem` row to the API `InvoiceItemEntity`. Decimal columns
 * are normalised and the JSON `description` is narrowed via `toJsonRecord`.
 */
export function toInvoiceItemEntity(row: InvoiceItemRow): InvoiceItemEntity {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
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

function toPaymentEntity(row: PaymentRow): PaymentEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    invoiceId: row.invoiceId,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    transactionId: row.transactionId,
    details: row.details,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Convert the flat fields of a Prisma `Invoice` row (Decimal -> number,
 * JsonValue -> JsonRecord). Relations are added by the wrapper mappers below.
 */
function toInvoiceBase(row: InvoiceRowFlat): InvoiceEntity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    sequence: row.sequence,
    businessId: row.businessId,
    clientId: row.clientId,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    clientAddress: row.clientAddress,
    invoiceNumber: row.invoiceNumber,
    purchaseOrder: row.purchaseOrder,
    customHeader: row.customHeader,
    status: row.status,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    currency: row.currency,
    subtotal: Number(row.subtotal),
    totalTax: Number(row.totalTax),
    discount: Number(row.discount),
    discountType: row.discountType,
    taxMode: row.taxMode,
    taxName: row.taxName,
    taxPercentage: row.taxPercentage != null ? Number(row.taxPercentage) : null,
    total: Number(row.total),
    balance: Number(row.balance),
    notes: toJsonRecord(row.notes),
    terms: toJsonRecord(row.terms),
    paymentLink: row.paymentLink,
    paymentProvider: row.paymentProvider,
    sentAt: row.sentAt,
    viewedAt: row.viewedAt,
    paidAt: row.paidAt,
    voidedAt: row.voidedAt,
    lastReminderSentAt: row.lastReminderSentAt,
    selectedPaymentMethodId: row.selectedPaymentMethodId,
    publicSlug: row.publicSlug,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Convert a Prisma `Invoice` row with full relations into the
 * `InvoiceEntityWithRelations` API shape. The `selectedPaymentMethod` relation
 * is optional and surfaced as a minimal projection (matches schema).
 */
export function toInvoiceEntityWithRelations(
  row: InvoiceRowWithRelations,
): InvoiceEntityWithRelations {
  return {
    ...toInvoiceBase(row),
    business: toBusinessEntity(row.business),
    client: row.client,
    items: row.items.map(toInvoiceItemEntity),
    payments: row.payments.map(toPaymentEntity),
    selectedPaymentMethod: row.selectedPaymentMethod
      ? {
          id: row.selectedPaymentMethod.id,
          type: row.selectedPaymentMethod.type,
          handle: row.selectedPaymentMethod.handle,
          isEnabled: row.selectedPaymentMethod.isEnabled,
        }
      : null,
  };
}
