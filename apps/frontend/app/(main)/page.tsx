"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, FileCheck, FileSearch, Inbox } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import { useDashboardStats } from "@/features/dashboard";
import { mapStatusToUI } from "@/features/invoices/types/api";
import { useExpenseDashboardStats } from "@/features/expenses";
import { cn, formatCurrency } from "@/lib/utils";
import { getClientDisplayLines } from "@/components/shared/list-card";
import {
  dismissRootShortcuts,
  hasDismissedRootShortcuts,
} from "@/lib/root-shortcuts";
import { ShortcutInterface } from "@/components/shortcut-interface";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import type { InvoiceResponse } from "@/features/invoices";

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_PERIODS = [
  { value: "7d" as const, label: "Last 7 days" },
  { value: "30d" as const, label: "Last 30 days" },
  { value: "6m" as const, label: "Last 6 months" },
  { value: "12m" as const, label: "Last 12 months" },
] as const;

const INVOICE_FILTERS = ["Recent", "Open", "Overdue", "Paid"] as const;
const ESTIMATE_FILTERS = ["Recent", "Sent", "Accepted"] as const;

const chartConfig = {
  earnings: { label: "Earnings", color: "var(--chart-earnings)" },
  expenses: { label: "Expenses", color: "var(--chart-expenses)" },
} satisfies ChartConfig;

// ─── Sparkline ───────────────────────────────────────────────────────────────

const DECORATIVE_SPARKLINE = [12, 28, 18, 42, 24, 48, 30, 38, 22, 44, 26, 36];

function buildSparkCoords(values: number[]) {
  const mainEndX = 86;
  const coords = values.map((val, i) => ({
    x: values.length === 1 ? 0 : (i / (values.length - 1)) * mainEndX,
    val,
  }));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const last = values[values.length - 1] ?? min;

  coords.push({ x: 93, val: min + range * 0.12 });
  coords.push({ x: 97, val: last - range * 0.08 });
  coords.push({ x: 100, val: max + range * 0.55 });

  return coords;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const isFlat = max === min;
  const series = isFlat ? DECORATIVE_SPARKLINE : data;
  const coords = buildSparkCoords(series);

  const plotMin = Math.min(...coords.map((c) => c.val));
  const plotMax = Math.max(...coords.map((c) => c.val));
  const plotRange = plotMax - plotMin || 1;

  const points = coords
    .map(
      ({ x, val }) =>
        `${x},${88 - ((val - plotMin) / plotRange) * 34}`,
    )
    .join(" ");

  const gradId = `spark-fill-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full h-[42%] pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  dotColor: string;
  sparkData: number[];
  sparkColor: string;
  glowColor: string;
  tourId?: string;
}

function StatCard({
  label,
  value,
  dotColor,
  sparkData,
  sparkColor,
  glowColor,
  tourId,
}: StatCardProps) {
  return (
    <div
      data-tour-id={tourId}
      className="bg-white/70 dark:bg-card/60 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-3xl p-4 sm:p-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group min-w-0 w-full"
    >
      <Sparkline data={sparkData} color={sparkColor} />
      <div
        className={cn(
          "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl transition-colors",
          glowColor,
        )}
      />
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <div className={cn("w-2.5 h-2.5 rounded-full", dotColor)} />
        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-xl sm:text-xl font-black text-foreground relative z-10 font-mono tabular-nums break-words">
        {value}
      </p>
    </div>
  );
}

// ─── Invoice mini card ───────────────────────────────────────────────────────

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  overdue: "bg-red-500/10 text-red-500",
  issued: "bg-chart-3/10 text-chart-3",
  viewed: "bg-blue-500/10 text-blue-500",
  draft: "bg-secondary text-muted-foreground",
  voided: "bg-destructive/10 text-destructive",
};

function InvoiceMiniCard({ invoice }: { invoice: InvoiceResponse }) {
  const uiStatus = mapStatusToUI(invoice.status);
  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(invoice.client, "—");
  const dueDateLabel = new Date(invoice.dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/invoices/${invoice.sequence}`}>
      <div className="min-w-[240px] bg-card/50 border border-border/40 rounded-2xl p-5 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 group shrink-0 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <FileText className="w-6 h-6" />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase font-bold tracking-wider border-0",
              INVOICE_STATUS_COLORS[uiStatus] ??
                "bg-secondary text-muted-foreground",
            )}
          >
            {uiStatus}
          </Badge>
        </div>
        <p className="font-bold text-foreground truncate">{clientName}</p>
        {clientBusinessName && (
          <p className="text-xs text-muted-foreground truncate">
            {clientBusinessName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-1 mt-0.5">
          {invoice.invoiceNumber}
        </p>
        <p className="text-2xl font-mono font-black text-foreground mt-2">
          {formatCurrency(invoice.total ?? 0)}
        </p>
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Balance{" "}
            <span
              className={cn(
                "font-semibold font-mono tabular-nums",
                (invoice.balance ?? 0) <= 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {formatCurrency(invoice.balance ?? 0)}
            </span>
          </span>
          <span className="text-muted-foreground shrink-0">
            Due {dueDateLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Estimate mini card ──────────────────────────────────────────────────────

function EstimateMiniCard({
  estimate,
}: {
  estimate: EstimateDashboardResponse;
}) {
  const status = estimate.status?.toLowerCase() ?? "draft";
  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(estimate.client, "—");
  const statusColors: Record<string, string> = {
    accepted: "bg-green-500/10 text-green-500",
    sent: "bg-orange-500/10 text-orange-500",
    viewed: "bg-blue-500/10 text-blue-500",
  };
  return (
    <Link href={`/estimates/${estimate.sequence}`}>
      <div className="min-w-[240px] bg-card/50 border border-border/40 rounded-2xl p-5 hover:bg-card hover:border-orange-500/30 hover:shadow-md transition-all duration-300 group shrink-0 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <FileCheck className="w-6 h-6" />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase font-bold tracking-wider border-0",
              statusColors[status] ?? "bg-secondary text-muted-foreground",
            )}
          >
            {status}
          </Badge>
        </div>
        <p className="font-bold text-foreground truncate">{clientName}</p>
        {clientBusinessName && (
          <p className="text-xs text-muted-foreground truncate">
            {clientBusinessName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-1 mt-0.5">
          {estimate.estimateNumber}
        </p>
        <p className="text-2xl font-mono font-black text-foreground mt-2">
          {formatCurrency(estimate.total ?? 0)}
        </p>
      </div>
    </Link>
  );
}

// ─── Dashboard home ──────────────────────────────────────────────────────────

function DashboardHome() {
  const [periodFilter, setPeriodFilter] = useState<"7d" | "30d" | "6m" | "12m">(
    "30d",
  );
  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("Recent");
  const [estimateFilter, setEstimateFilter] = useState<string>("Recent");

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats({
    businessId:
      businessIdFilter === "all" ? undefined : Number(businessIdFilter),
    period: periodFilter,
  });

  const {
    data: expenseStats,
    isLoading: expenseLoading,
    error: expenseError,
  } = useExpenseDashboardStats({ period: periodFilter });

  const isLoading = statsLoading || expenseLoading;
  const error = statsError ?? expenseError;

  const chartData = useMemo(() => {
    if (!stats?.chartSeries) return [];
    const expenseByLabel = new Map<string, number>();
    const expenseSeries =
      (
        expenseStats as
          | { chartSeries?: { label: string; amount: number }[] }
          | undefined
      )?.chartSeries ?? [];
    expenseSeries.forEach((p: { label: string; amount: number }) =>
      expenseByLabel.set(p.label, p.amount),
    );
    return stats.chartSeries.map((p) => ({
      label: p.label,
      earnings: p.revenue,
      expenses: expenseByLabel.get(p.label) ?? 0,
    }));
  }, [stats?.chartSeries, expenseStats]);

  const sparklinePoints = useMemo(() => {
    const slice = (stats?.chartSeries ?? []).slice(-8).map((p) => p.revenue);
    return slice.length >= 2 ? slice : [0, 0, 0, 0, 0, 0, 0, 0];
  }, [stats?.chartSeries]);

  const expenseSparkline = useMemo(() => {
    const series =
      (
        expenseStats as
          | { chartSeries?: { label: string; amount: number }[] }
          | undefined
      )?.chartSeries ?? [];
    const slice = series.slice(-8).map((p) => p.amount);
    return slice.length >= 2 ? slice : [0, 0, 0, 0, 0, 0, 0, 0];
  }, [expenseStats]);

  const filteredInvoices = useMemo(() => {
    const all = (stats?.recentInvoices ?? []) as InvoiceResponse[];
    if (invoiceFilter === "Open")
      return all.filter((i) => i.status === "SENT" || i.status === "VIEWED");
    if (invoiceFilter === "Overdue")
      return all.filter((i) => i.status === "OVERDUE");
    if (invoiceFilter === "Paid") return all.filter((i) => i.status === "PAID");
    return all;
  }, [stats?.recentInvoices, invoiceFilter]);

  const filteredEstimates = useMemo(() => {
    const all = (stats?.recentEstimates ?? []) as EstimateDashboardResponse[];
    if (estimateFilter === "Sent")
      return all.filter((e) => e.status === "SENT" || e.status === "VIEWED");
    if (estimateFilter === "Accepted")
      return all.filter((e) => e.status === "ACCEPTED");
    return all;
  }, [stats?.recentEstimates, estimateFilter]);

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOutstanding = stats?.totalOutstanding ?? 0;
  const totalSpent = expenseStats?.totalAmount ?? 0;
  const projected = totalRevenue + totalOutstanding;
  const paidRatio = projected > 0 ? totalRevenue / projected : 0;

  return (
    <div className="flex flex-col min-h-screen -mx-4 sm:-mx-6 -mt-6 sm:-mt-8">
      {/* Hero section */}
      <div className="pt-8 sm:pt-12 pb-20 px-4 sm:px-6 relative z-0">
        <div className="flex justify-end mb-6">
          <DashboardBusinessFilter
            businessId={businessIdFilter}
            onBusinessIdChange={setBusinessIdFilter}
          />
        </div>

        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-muted-foreground uppercase">
            Projected Revenue
          </span>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <h1
              data-tour-id="dashboard-total-earned"
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-sm font-mono tabular-nums relative z-10"
            >
              {isLoading ? (
                <Skeleton className="h-16 w-56 mx-auto" />
              ) : (
                formatCurrency(projected)
              )}
            </h1>
          </div>

          {!isLoading && projected > 0 && (
            <div className="w-full max-w-sm flex h-2 rounded-full overflow-hidden mt-6 bg-secondary/50 shadow-inner border border-border/50">
              <motion.div
                className="bg-linear-to-r from-primary-dark via-primary to-primary-light h-full shrink-0"
                initial={{ width: 0 }}
                animate={{ width: `${paidRatio * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="bg-linear-to-r from-chart-4/80 to-chart-4 h-full shrink-0"
                initial={{ width: 0 }}
                animate={{ width: `${(1 - paidRatio) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              />
            </div>
          )}
        </div>

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto w-full">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-3xl bg-card/50 p-4 sm:p-5 min-w-0">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-7 w-32 max-w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto w-full">
            <StatCard
              tourId="dashboard-paid"
              label="Paid"
              value={formatCurrency(totalRevenue)}
              dotColor="bg-[#00afc0] shadow-[0_0_10px_rgba(0,175,192,0.7)]"
              sparkData={sparklinePoints}
              sparkColor="#00afc0"
              glowColor="bg-[#00afc0]/10 group-hover:bg-[#00afc0]/20"
            />
            <StatCard
              tourId="dashboard-total-spent"
              label="Spent"
              value={formatCurrency(totalSpent)}
              dotColor="bg-[#f5b942] shadow-[0_0_8px_rgba(245,185,66,0.7)]"
              sparkData={expenseSparkline}
              sparkColor="#f5b942"
              glowColor="bg-[#f5b942]/10 group-hover:bg-[#f5b942]/20"
            />
            <StatCard
              tourId="dashboard-customers-owe"
              label="Owe"
              value={formatCurrency(totalOutstanding)}
              dotColor="bg-[#9ca3af] shadow-[0_0_8px_rgba(156,163,175,0.5)]"
              sparkData={sparklinePoints.map((v) => v * 0.4)}
              sparkColor="#9ca3af"
              glowColor="bg-[#9ca3af]/10 group-hover:bg-[#9ca3af]/20"
            />
          </div>
        )}
      </div>

      {/* Overlapping content card */}
      <div className="flex-1 bg-background/80 backdrop-blur-3xl rounded-t-[3rem] px-5 sm:px-10 pt-8 pb-10 -mt-8 relative z-10 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] border-t border-white/20 dark:border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-linear-to-r from-primary-dark/0 via-primary-light/20 to-primary-dark/0 blur-2xl rounded-full pointer-events-none" />
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-8 opacity-50" />

        {error && (
          <p className="text-sm text-destructive mb-6">
            Failed to load dashboard data. Please try again.
          </p>
        )}

        {/* Invoices */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Invoices
              </h2>
            </div>
            <Link href="/invoices">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                View all
              </Button>
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
            {INVOICE_FILTERS.map((filter) => (
              <Badge
                key={filter}
                onClick={() => setInvoiceFilter(filter)}
                className={cn(
                  "cursor-pointer px-4 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap",
                  invoiceFilter === filter
                    ? filter === "Overdue"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : filter === "Paid"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {filter}
              </Badge>
            ))}
          </div>

          <div
            id="dashboard-recent-invoices"
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-[240px] h-44 rounded-2xl shrink-0"
                />
              ))
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <InvoiceMiniCard key={invoice.id} invoice={invoice} />
              ))
            ) : (
              <div className="w-full text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border/50 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Inbox className="w-8 h-8 text-primary opacity-80" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No {invoiceFilter.toLowerCase()} invoices
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Estimates */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Estimates
              </h2>
            </div>
            <Link href="/estimates">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                View all
              </Button>
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
            {ESTIMATE_FILTERS.map((filter) => (
              <Badge
                key={filter}
                onClick={() => setEstimateFilter(filter)}
                className={cn(
                  "cursor-pointer px-4 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap",
                  estimateFilter === filter
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {filter}
              </Badge>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-[240px] h-44 rounded-2xl shrink-0"
                />
              ))
            ) : filteredEstimates.length > 0 ? (
              filteredEstimates.map((estimate) => (
                <EstimateMiniCard key={estimate.id} estimate={estimate} />
              ))
            ) : (
              <div className="w-full text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border/50 flex flex-col items-center">
                <FileSearch className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No {estimateFilter.toLowerCase()} estimates
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Revenue Trend */}
        <section
          id="dashboard-revenue-chart"
          data-tour-id="dashboard-revenue-chart"
          className="pt-8 border-t border-border/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h3 className="text-lg font-bold text-foreground">Revenue Trend</h3>
            <Select
              value={periodFilter}
              onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Skeleton className="h-[220px] w-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-earnings)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-earnings)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-expenses)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-expenses)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="var(--color-earnings)"
                  strokeWidth={2}
                  fill="url(#fillEarnings)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--color-expenses)"
                  strokeWidth={2}
                  fill="url(#fillExpenses)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground bg-secondary/20 rounded-xl border border-border/50">
              <p className="text-sm">No revenue data yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Surface router ──────────────────────────────────────────────────────────

type RootSurface = "hydrating" | "shortcuts" | "dashboard";

function DashboardRoot() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [surface, setSurface] = useState<RootSurface>("hydrating");

  const goToDashboard = useCallback(() => setSurface("dashboard"), []);

  useEffect(() => {
    const view = searchParams.get("view");
    const shortcuts = searchParams.get("shortcuts");

    if (view === "dashboard" || shortcuts === "0") {
      dismissRootShortcuts();
      router.replace("/", { scroll: false });
      setSurface("dashboard");
      return;
    }
    if (shortcuts === "1") {
      setSurface("shortcuts");
      return;
    }
    setSurface(hasDismissedRootShortcuts() ? "dashboard" : "shortcuts");
  }, [router, searchParams]);

  if (surface === "hydrating") {
    return (
      <div className="space-y-6 pt-8">
        <Skeleton className="h-16 w-56 mx-auto" />
        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (surface === "shortcuts") {
    return <ShortcutInterface onRequestDashboard={goToDashboard} />;
  }

  return <DashboardHome />;
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardRoot />
    </Suspense>
  );
}
