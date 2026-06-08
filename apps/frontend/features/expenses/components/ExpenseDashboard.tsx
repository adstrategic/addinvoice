"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useExpenseDashboardStats } from "../hooks/useExpenseDashboardStats";

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
      <Card className="mb-6 sm:mb-8 bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="mb-6 sm:mb-8 p-6 bg-card border-border">
        <p className="text-destructive">
          Failed to load expense chart. Please try again later.
        </p>
      </Card>
    );
  }

  return (
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
            <span className="text-2xl font-bold font-mono tabular-nums">
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
                    hoveredIndex === null || hoveredIndex === index ? 1 : 0.3
                  }
                  style={{ transition: "opacity 0.3s ease-in-out" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
