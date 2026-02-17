import prisma from "../../core/db";
import type { Prisma } from "../../generated/prisma/client";
import type { ListPaymentsQuery, PaymentList } from "./payments.schemas";
import { EntityNotFoundError } from "../../errors/EntityErrors";
import type { PaymentDetail } from "../invoices/invoices.schemas";
/**
 * List payments for a workspace with optional filters
 */
export async function listPayments(
  workspaceId: number,
  query: ListPaymentsQuery,
): Promise<{
  payments: PaymentList[];
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
}> {
  const { page, limit, businessId, dateFrom, dateTo, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {
    workspaceId,

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
      where,
      skip,
      take: limit,
      orderBy: { paidAt: "desc" },
      include: {
        invoice: {
          select: {
            sequence: true,
            invoiceNumber: true,
            currency: true,
            total: true,
            balance: true,
            status: true,
            clientEmail: true,
            client: {
              select: { id: true, name: true, businessName: true },
            },
            business: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  const items: PaymentList[] = payments.map((p) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    invoiceId: p.invoiceId,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    details: p.details,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    invoice: {
      sequence: p.invoice.sequence,
      invoiceNumber: p.invoice.invoiceNumber,
      currency: p.invoice.currency,
      total: Number(p.invoice.total),
      balance: Number(p.invoice.balance),
      status: p.invoice.status,
      clientEmail: p.invoice.clientEmail,
      client: p.invoice.client,
      business: p.invoice.business,
    },
  }));

  return {
    payments: items,
    total,
    totalAmount: Number(sumResult._sum?.amount ?? 0),
    page,
    limit,
  };
}

/**
 * Get a single payment by ID with full invoice, client, and business context
 */
export async function getPaymentById(
  workspaceId: number,
  paymentId: number,
): Promise<PaymentDetail> {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      workspaceId,
    },
    include: {
      invoice: {
        include: {
          client: true,
          business: true,
        },
      },
    },
  });

  if (!payment) {
    throw new EntityNotFoundError({
      message: "Payment not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  const inv = payment.invoice;
  return {
    id: payment.id,
    workspaceId: payment.workspaceId,
    invoiceId: payment.invoiceId,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    details: payment.details,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    invoice: {
      ...inv,
      subtotal: Number(inv.subtotal),
      totalTax: Number(inv.totalTax),
      discount: Number(inv.discount),
      taxPercentage:
        inv.taxPercentage != null ? Number(inv.taxPercentage) : null,
      total: Number(inv.total),
      balance: Number(inv.balance),
      client: inv.client,
      business: {
        ...inv.business,
        defaultTaxPercentage:
          inv.business.defaultTaxPercentage != null
            ? Number(inv.business.defaultTaxPercentage)
            : null,
      },
    },
  };
}
