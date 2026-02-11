import prisma from "../../core/db";
import type { Prisma } from "../../generated/prisma/client";
import type {
  DashboardStatsQuery,
  DashboardStatsResponse,
  MonthlyRevenue,
} from "./dashboard.schemas";
import type { InvoiceEntity } from "../invoices/invoices.schemas";

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
    deletedAt: null,
    ...(businessId && { businessId }),
  };

  // Get all invoices for calculations
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: true,
      business: true,
    },
    orderBy: { createdAt: "desc" },
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

  // Calculate total revenue (sum of paid invoices)
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  // Calculate monthly revenue for the last 12 months
  const monthlyRevenue = calculateMonthlyRevenue(invoices);

  // Get recent invoices (last 5, ordered by creation date)
  // Fetch items and payments for recent invoices
  const recentInvoicesIds = invoices.slice(0, 5).map((inv) => inv.id);
  const recentInvoicesWithDetails = await prisma.invoice.findMany({
    where: {
      id: { in: recentInvoicesIds },
    },
    include: {
      business: true,
      client: true,
      items: {
        orderBy: { name: "asc" },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentInvoicesData: InvoiceEntity[] = recentInvoicesWithDetails.map(
    (inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      totalTax: Number(inv.totalTax),
      discount: Number(inv.discount),
      taxPercentage: inv.taxPercentage ? Number(inv.taxPercentage) : null,
      total: Number(inv.total),
      balance: Number(inv.balance),
      items: inv.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })),
      payments: inv.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }),
  );

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    thisWeekInvoices,
    thisMonthInvoices,
    totalRevenue,
    monthlyRevenue,
    recentInvoices: recentInvoicesData,
  };
}

/**
 * Calculate monthly revenue for the last 12 months
 */
function calculateMonthlyRevenue(invoices: any[]): MonthlyRevenue[] {
  const now = new Date();
  const months: MonthlyRevenue[] = [];
  const monthNames = [
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

  // Get last 12 months
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

    const monthRevenue = invoices
      .filter((inv) => {
        const paidDate = inv.paidAt ? new Date(inv.paidAt) : null;
        return (
          inv.status === "PAID" &&
          paidDate &&
          paidDate >= monthStart &&
          paidDate <= monthEnd
        );
      })
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    months.push({
      month: monthNames[date.getMonth()],
      revenue: monthRevenue,
    });
  }

  return months;
}
