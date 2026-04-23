"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { Receipt, DollarSign, CalendarDays, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useExpenseDashboardStats } from "../hooks/useExpenseDashboardStats";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const expenseChartConfig = {
  amount: {
    label: "Amount",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ExpenseDashboardProps {
  workCategoryId: string;
}

export function ExpenseDashboard({ workCategoryId }: ExpenseDashboardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const workCategoryIdNum =
    workCategoryId === "all" ? undefined : parseInt(workCategoryId, 10);
  const {
    data: stats,
    isLoading,
    error,
  } = useExpenseDashboardStats({
    workCategoryId: workCategoryIdNum,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 mb-6 sm:mb-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="mb-6 sm:mb-8 p-6 bg-card border-border">
        <p className="text-destructive">
          Failed to load expense dashboard data. Please try again later.
        </p>
      </Card>
    );
  }

  return (
    <div className="mb-6 sm:mb-8">
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6 sm:mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.totalExpenses}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sum of all expenses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.thisMonthExpenses}
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
                  Monthly Expenses
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Amount spent over the past 12 months
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {formatCurrency(stats.totalAmount)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={expenseChartConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={stats.monthlyExpenses}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => `$${value / 1000}K`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {name === "amount"
                              ? expenseChartConfig.amount.label
                              : String(name)}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  name="amount"
                  radius={[8, 8, 0, 0]}
                  barSize={35}
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {stats.monthlyExpenses.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="var(--color-amount)"
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
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
