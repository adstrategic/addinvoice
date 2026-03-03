"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Receipt,
  DollarSign,
  Calendar,
  CalendarDays,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useExpenseDashboardStats } from "../hooks/useExpenseDashboardStats";
import { ExpenseCard } from "./ExpenseCard";
import type { ExpenseResponse } from "../schema/expenses.schema";

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

const barColor = "#007587";

interface ExpenseDashboardProps {
  workCategoryId: string;
}

export function ExpenseDashboard({ workCategoryId }: ExpenseDashboardProps) {
  const router = useRouter();
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

  const avgPerExpense =
    stats && stats.totalExpenses > 0
      ? stats.totalAmount / stats.totalExpenses
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 mb-6 sm:mb-8">
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
        <Card>
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
      <Card className="mb-6 sm:mb-8 p-6">
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
            <ResponsiveContainer width="100%" height={300} minHeight={250}>
              <BarChart data={stats.monthlyExpenses}>
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
                    formatCurrency(value ?? 0),
                    "Amount",
                  ]}
                />
                <Bar
                  dataKey="amount"
                  radius={[8, 8, 0, 0]}
                  barSize={35}
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {stats.monthlyExpenses.map((_, index) => (
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
    </div>
  );
}
