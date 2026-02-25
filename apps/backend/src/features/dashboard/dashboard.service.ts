import type { Prisma } from "@addinvoice/db";

import { prisma } from "@addinvoice/db";

import type { InvoiceEntityWithRelations } from "../invoices/invoices.schemas.js";
import type {
  DashboardStatsQuery,
  DashboardStatsResponse,
  MonthlyRevenue,
} from "./dashboard.schemas.js";

/**
 * Get dashboard statistics for a workspace
 */
export async function getDashboardStats(
  workspaceId: number,
  query: DashboardStatsQuery,
): Promise<DashboardStatsResponse> {
  const { businessId } = query;

  // Base where clause
  const where: Prisma.InvoiceWhereInput = {
    workspaceId,
    ...(businessId && { businessId }),
  };

  // Get all invoices for calculations
  const invoices = await prisma.invoice.findMany({
    include: {
      business: true,
      client: true,
    },
    orderBy: { createdAt: "desc" },
    where,
  });

  // Calculate stats
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length;
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "SENT" || inv.status === "VIEWED",
  ).length;
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "OVERDUE",
  ).length;

  const thisWeekInvoices = invoices.filter(
    (inv) => new Date(inv.createdAt) >= startOfWeek,
  ).length;

  const thisMonthInvoices = invoices.filter(
    (inv) => new Date(inv.createdAt) >= startOfMonth,
  ).length;

  // Payment filter: non-deleted payments for non-deleted invoices (optional businessId)
  const paymentWhere: Prisma.PaymentWhereInput = {
    invoice: {
      ...(businessId && { businessId }),
    },
    workspaceId,
  };

  // Total revenue = sum of actual payment amounts (handles partial/overpayments)
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: paymentWhere,
  });
  const totalRevenue = Number(totalRevenueResult._sum.amount ?? 0);

  // Monthly revenue = sum of payment amounts by paidAt month (last 12 months)
  const monthlyRevenue = await calculateMonthlyRevenueFromPayments(
    prisma,
    paymentWhere,
  );

  // Get recent invoices (last 5, ordered by creation date)
  // Fetch items and payments for recent invoices
  const recentInvoicesIds = invoices.slice(0, 5).map((inv) => inv.id);
  const recentInvoicesWithDetails = await prisma.invoice.findMany({
    include: {
      business: true,
      client: true,
      items: {
        orderBy: { name: "asc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    where: {
      id: { in: recentInvoicesIds },
    },
  });

  const recentInvoicesData: InvoiceEntityWithRelations[] =
    recentInvoicesWithDetails.map((inv) => ({
      ...inv,
      balance: Number(inv.balance),
      business: {
        ...inv.business,
        defaultTaxPercentage: inv.business.defaultTaxPercentage
          ? Number(inv.business.defaultTaxPercentage)
          : null,
      },
      client: {
        ...inv.client,
      },
      discount: Number(inv.discount),
      items: inv.items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        total: Number(item.total),
        unitPrice: Number(item.unitPrice),
      })),
      payments: inv.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
      subtotal: Number(inv.subtotal),
      taxPercentage: inv.taxPercentage ? Number(inv.taxPercentage) : null,
      total: Number(inv.total),
      totalTax: Number(inv.totalTax),
    }));

  return {
    monthlyRevenue,
    overdueInvoices,
    paidInvoices,
    pendingInvoices,
    recentInvoices: recentInvoicesData,
    thisMonthInvoices,
    thisWeekInvoices,
    totalInvoices,
    totalRevenue,
  };
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Calculate monthly revenue for the last 12 months from actual payment amounts (paidAt).
 */
async function calculateMonthlyRevenueFromPayments(
  prismaClient: typeof prisma,
  paymentWhere: Prisma.PaymentWhereInput,
): Promise<MonthlyRevenue[]> {
  const now = new Date();
  const startOfOldestMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
  );
  const endOfCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const payments = await prismaClient.payment.findMany({
    select: { amount: true, paidAt: true },
    where: {
      ...paymentWhere,
      paidAt: { gte: startOfOldestMonth, lte: endOfCurrentMonth },
    },
  });

  // Build 12 months with same labels as before
  const months: MonthlyRevenue[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthRevenue = payments
      .filter((p) => {
        const paidDate = new Date(p.paidAt);
        return paidDate >= monthStart && paidDate <= monthEnd;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    months.push({
      month: MONTH_NAMES[date.getMonth()] ?? "Unknown",
      revenue: monthRevenue,
    });
  }

  return months;
}
