import type { Prisma } from "@addinvoice/db";

import { prisma } from "@addinvoice/db";

import type { PaymentDetail } from "../invoices/invoices.schemas.js";
import type { ListPaymentsQuery, PaymentList } from "./payments.schemas.js";

import { EntityNotFoundError } from "../../errors/EntityErrors.js";
/**
 * Get a single payment by ID with full invoice, client, and business context
 */
export async function getPaymentById(
  workspaceId: number,
  paymentId: number,
): Promise<PaymentDetail> {
  const payment = await prisma.payment.findFirst({
    include: {
      invoice: {
        include: {
          business: true,
          client: true,
        },
      },
    },
    where: {
      id: paymentId,
      workspaceId,
    },
  });

  if (!payment) {
    throw new EntityNotFoundError({
      code: "ERR_NF",
      message: "Payment not found",
      statusCode: 404,
    });
  }

  const inv = payment.invoice;
  return {
    amount: Number(payment.amount),
    createdAt: payment.createdAt,
    details: payment.details,
    id: payment.id,
    invoice: {
      ...inv,
      balance: Number(inv.balance),
      business: {
        ...inv.business,
        defaultTaxPercentage:
          inv.business.defaultTaxPercentage != null
            ? Number(inv.business.defaultTaxPercentage)
            : null,
      },
      client: inv.client,
      discount: Number(inv.discount),
      subtotal: Number(inv.subtotal),
      taxPercentage:
        inv.taxPercentage != null ? Number(inv.taxPercentage) : null,
      total: Number(inv.total),
      totalTax: Number(inv.totalTax),
    },
    invoiceId: payment.invoiceId,
    paidAt: payment.paidAt,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    updatedAt: payment.updatedAt,
    workspaceId: payment.workspaceId,
  };
}

/**
 * List payments for a workspace with optional filters
 */
export async function listPayments(
  workspaceId: number,
  query: ListPaymentsQuery,
): Promise<{
  limit: number;
  page: number;
  payments: PaymentList[];
  total: number;
  totalAmount: number;
}> {
  const { businessId, dateFrom, dateTo, limit, page, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {
    invoice: {
      ...(businessId && { businessId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
          {
            client: { businessName: { contains: search, mode: "insensitive" } },
          },
        ],
      }),
    },

    workspaceId,
    ...(dateFrom &&
      dateTo && {
        paidAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    ...(dateFrom && !dateTo && { paidAt: { gte: new Date(dateFrom) } }),
    ...(!dateFrom && dateTo && { paidAt: { lte: new Date(dateTo) } }),
  };

  const [payments, total, sumResult] = await Promise.all([
    prisma.payment.findMany({
      include: {
        invoice: {
          select: {
            balance: true,
            business: {
              select: { id: true, name: true },
            },
            client: {
              select: { businessName: true, id: true, name: true },
            },
            clientEmail: true,
            currency: true,
            invoiceNumber: true,
            sequence: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ _sum: { amount: true }, where }),
  ]);

  const items: PaymentList[] = payments.map((p) => ({
    amount: Number(p.amount),
    createdAt: p.createdAt,
    details: p.details,
    id: p.id,
    invoice: {
      balance: Number(p.invoice.balance),
      business: p.invoice.business,
      client: p.invoice.client,
      clientEmail: p.invoice.clientEmail,
      currency: p.invoice.currency,
      invoiceNumber: p.invoice.invoiceNumber,
      sequence: p.invoice.sequence,
      status: p.invoice.status,
      total: Number(p.invoice.total),
    },
    invoiceId: p.invoiceId,
    paidAt: p.paidAt,
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    updatedAt: p.updatedAt,
    workspaceId: p.workspaceId,
  }));

  return {
    limit,
    page,
    payments: items,
    total,
    totalAmount: Number(sumResult._sum.amount ?? 0),
  };
}
