"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  TrendingDown,
  Plus,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDashboardStats } from "@/features/dashboard";
import { useExpenseDashboardStats } from "@/features/expenses";
import { InvoiceCard } from "@/features/invoices/components/InvoiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

const CHART_PERIODS = [
  { value: "7d" as const, label: "Last 7 days" },
  { value: "30d" as const, label: "Last 30 days" },
  { value: "6m" as const, label: "Last 6 months" },
  { value: "12m" as const, label: "Last 12 months" },
] as const;

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--chart-earnings)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-expenses)",
  },
} satisfies ChartConfig;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  tourId?: string;
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClassName = "text-primary",
  tourId,
}: StatCardProps) {
  return (
    <Card
      data-tour-id={tourId}
      className="shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon
          className={cn(
            "h-4 w-4 opacity-80 group-hover:opacity-100",
            iconClassName,
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [periodFilter, setPeriodFilter] = useState<"7d" | "30d" | "6m" | "12m">(
    "30d",
  );
  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");

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

  return (
    <>
      {/* GRADIENT OPTION — swap className below to compare designs:
          Current (flat): remove the wrapper div entirely
          Gradient A (light teal): bg-gradient-to-br from-teal-50/80 via-slate-50 to-sky-100/60
          Gradient B (dark navy): bg-gradient-to-br from-[#0c1524] via-[#111e35] to-[#0c1520]
      */}
      {/* <div className="min-h-screen bg-gradient-to-br from-teal-50/80 via-slate-50 to-sky-100/60"> */}
      <div className="container mx-auto mt-16 sm:mt-0 px-4 sm:px-6 py-6 sm:py-8">
        {/* Header with Business Filter */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of your invoices and revenue
            </p>
          </div>
          <DashboardBusinessFilter
            businessId={businessIdFilter}
            onBusinessIdChange={setBusinessIdFilter}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 shadow-sm">
            <p className="text-destructive">
              Failed to load dashboard data. Please try again later.
            </p>
          </Card>
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && stats && (
          <>
            {/* Overview stats: Total earned, Total spent, Customers owe */}
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Overview
              </h2>
              <motion.div
                className="grid gap-4 grid-cols-1 sm:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <StatCard
                    tourId="dashboard-total-earned"
                    label="Total earned"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={TrendingUp}
                    iconClassName="text-primary"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <StatCard
                    tourId="dashboard-total-spent"
                    label="Total spent"
                    value={formatCurrency(expenseStats?.totalAmount ?? 0)}
                    icon={TrendingDown}
                    iconClassName="text-destructive"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <StatCard
                    tourId="dashboard-customers-owe"
                    label="Customers owe"
                    value={formatCurrency(stats.totalOutstanding)}
                    icon={Wallet}
                    iconClassName="text-chart-4"
                  />
                </motion.div>
              </motion.div>
            </section>

            {/* Earnings vs Expenses chart + Recent Invoices */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card
                  data-tour-id="dashboard-revenue-chart"
                  className="h-full shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                            Earnings vs expenses
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            By payment date (earnings) and expense date
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-primary">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Earnings
                          </span>
                          <span className="flex items-center gap-1.5 text-destructive">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            Expenses
                          </span>
                        </div>
                      </div>
                      <Select
                        value={periodFilter}
                        onValueChange={(v) =>
                          setPeriodFilter(v as "7d" | "30d" | "6m" | "12m")
                        }
                      >
                        <SelectTrigger className="w-full max-w-48">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHART_PERIODS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pr-2">
                    <ChartContainer
                      config={chartConfig}
                      className="min-h-[300px] w-full"
                    >
                      <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ left: 12, right: 12 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillEarnings"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--color-earnings)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--color-earnings)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="fillExpenses"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--color-expenses)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--color-expenses)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={32}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) =>
                            value >= 1000 ? `$${value / 1000}K` : `$${value}`
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => {
                                const label =
                                  name === "earnings"
                                    ? chartConfig.earnings.label
                                    : chartConfig.expenses.label;
                                return (
                                  <div className="flex w-full items-center justify-between gap-4">
                                    <span className="text-muted-foreground">
                                      {label}
                                    </span>
                                    <span className="font-mono font-medium tabular-nums text-foreground">
                                      {formatCurrency(Number(value))}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          }
                        />
                        <Area
                          dataKey="earnings"
                          type="monotone"
                          stroke="var(--color-earnings)"
                          fill="url(#fillEarnings)"
                          strokeWidth={2}
                        />
                        <Area
                          dataKey="expenses"
                          type="monotone"
                          stroke="var(--color-expenses)"
                          fill="url(#fillExpenses)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <Card
                  data-tour-id="dashboard-recent-invoices"
                  className="h-full shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                          Recent Invoices
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Latest activity
                        </p>
                      </div>
                      <Link href="/invoices">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.recentInvoices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">
                          No recent invoices
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats.recentInvoices.map((invoice, index) => (
                          <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            index={index}
                            linkOnly={true}
                            onDownload={() => {}}
                            onSend={() => {}}
                            onAddPayment={() => {}}
                            onDelete={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          </>
        )}
      </div>

      <Link href="/invoices">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 1,
            type: "spring",
            stiffness: 200,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            data-tour-id="dashboard-create-invoice-btn"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Create Invoice</span>
          </Button>
        </motion.div>
      </Link>
      {/* </div>{" "} */}
      {/* gradient wrapper */}
    </>
  );
}
