"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarDays,
  Plus,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useDashboardStats } from "@/features/dashboard";
import { mapStatusToUI } from "@/features/invoices";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export default function Dashboard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get("businessId");
  const businessId = businessIdParam
    ? parseInt(businessIdParam, 10)
    : undefined;

  const {
    data: stats,
    isLoading,
    error,
  } = useDashboardStats({
    businessId,
  });

  const barColor = "#007587";

  // Format date helper
  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate completion rate
  const completionRate =
    stats && stats.totalInvoices > 0
      ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
      : 0;

  return (
    <SubscriptionGuard>
      <AppLayout>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <DashboardBusinessFilter />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
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
            <Card className="p-6">
              <p className="text-destructive">
                Failed to load dashboard data. Please try again later.
              </p>
            </Card>
          )}

          {/* Dashboard Content */}
          {!isLoading && !error && stats && (
            <>
              <motion.div
                className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 sm:mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={cardVariants}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Invoices
                      </CardTitle>
                      <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.totalInvoices}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total invoices
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Paid Invoices
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.paidInvoices}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completionRate}% completion rate
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Invoices
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Awaiting payment
                          </p>
                        </div>
                        <Clock className="h-4 w-4 text-chart-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.pendingInvoices}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Week
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            This week
                          </p>
                        </div>
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.thisWeekInvoices}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Month
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            This month
                          </p>
                        </div>
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {stats.thisMonthInvoices}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="mb-6 sm:mb-8 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                          Monthly Revenue
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Revenue trends over the past 12 months
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-2xl font-bold">
                          ${(stats.totalRevenue / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer
                      width="100%"
                      height={300}
                      minHeight={250}
                    >
                      <BarChart data={stats.monthlyRevenue}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value / 1000}K`}
                        />
                        <Tooltip
                          cursor={false}
                          position={{ y: 0 }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            color: "hsl(var(--popover-foreground))",
                            boxShadow:
                              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                            zIndex: 1000,
                            padding: "12px",
                          }}
                          labelStyle={{
                            color: "hsl(var(--popover-foreground))",
                            fontWeight: 600,
                            marginBottom: "4px",
                          }}
                          formatter={(value: number) => [
                            `$${value.toLocaleString()}`,
                            "Revenue",
                          ]}
                        />
                        <Bar
                          dataKey="revenue"
                          radius={[8, 8, 0, 0]}
                          barSize={35}
                          onMouseEnter={(_, index) => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          {stats.monthlyRevenue.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={barColor}
                              opacity={
                                hoveredIndex === null || hoveredIndex === index
                                  ? 1
                                  : 0.3
                              }
                              style={{ transition: "opacity 0.3s ease-in-out" }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                          Recent Invoices
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Latest invoice activity
                        </p>
                      </div>
                      <Link href="/invoices">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 bg-transparent"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.recentInvoices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No recent invoices
                        </p>
                      </div>
                    ) : (
                      <div className="">
                        {stats.recentInvoices.map((invoice, index) => {
                          const status = mapStatusToUI(invoice.status);
                          const isPaid = status === "paid";
                          return (
                            <Link
                              key={invoice.id}
                              href={`/invoices/${invoice.sequence}`}
                              className="mb-4 block"
                            >
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.4,
                                  delay: 0.6 + index * 0.1,
                                }}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md cursor-pointer"
                              >
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground truncate">
                                      {invoice.invoiceNumber}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {invoice.client.name ||
                                        invoice.client.businessName ||
                                        "Unknown Client"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-[52px] sm:pl-0">
                                  <div className="text-left sm:text-right">
                                    <p className="font-semibold text-foreground">
                                      ${invoice.total.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(invoice.createdAt)}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={isPaid ? "default" : "secondary"}
                                    className={
                                      isPaid
                                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                                        : "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30"
                                    }
                                  >
                                    {isPaid ? "Paid" : "Pending"}
                                  </Badge>
                                </div>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        <Link href="/invoices/new">
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
              className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">Create Invoice</span>
            </Button>
          </motion.div>
        </Link>
      </AppLayout>
    </SubscriptionGuard>
  );
}
