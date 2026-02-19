"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useDashboardStats } from "@/features/dashboard";
import { InvoiceCard } from "@/features/invoices/components/InvoiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

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
  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");

  const {
    data: stats,
    isLoading,
    error,
  } = useDashboardStats({
    businessId:
      businessIdFilter === "all" ? undefined : Number(businessIdFilter),
  });

  const barColor = "#007587";

  // Calculate completion rate
  const completionRate =
    stats && stats.totalInvoices > 0
      ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
      : 0;

  return (
    <>
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
                <Card
                  data-tour-id="dashboard-total-invoices"
                  className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                >
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
                <Card
                  data-tour-id="dashboard-paid-invoices"
                  className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                >
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
                <Card
                  data-tour-id="dashboard-pending-invoices"
                  className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Overdue Invoices
                        </CardTitle>
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
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          This Week
                        </CardTitle>
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
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          This Month
                        </CardTitle>
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
              <Card
                data-tour-id="dashboard-revenue-chart"
                className="mb-6 sm:mb-8 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                        Monthly Revenue
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Amount received over the past 12 months (all payments)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-2xl font-bold">
                        {formatCurrency(stats.totalRevenue)}
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
                        formatter={(value: number | undefined) => [
                          `$${(value ?? 0).toLocaleString()}`,
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
              <Card
                data-tour-id="dashboard-recent-invoices"
                className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300"
              >
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
                    <div className="space-y-3">
                      {stats.recentInvoices.map((invoice, index) => (
                        <InvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          index={index}
                          linkOnly={true}
                          onView={(sequence) => {
                            // Navigation handled by linkOnly prop
                          }}
                          onEdit={() => {
                            // Not used in linkOnly mode
                          }}
                          onDownload={() => {
                            // Not used in linkOnly mode
                          }}
                          onSend={() => {
                            // Not used in linkOnly mode
                          }}
                          onAddPayment={() => {
                            // Not used in linkOnly mode
                          }}
                          onDelete={() => {
                            // Not used in linkOnly mode
                          }}
                        />
                      ))}
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
            data-tour-id="dashboard-create-invoice-btn"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Create Invoice</span>
          </Button>
        </motion.div>
      </Link>
    </>
  );
}
