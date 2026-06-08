"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useExpenseDashboardStats } from "../hooks/useExpenseDashboardStats";
import { ModuleHeroLabel } from "@/components/shared/module-ui";
import { getListCardTheme } from "@/components/shared/list-card-theme";
import { cn } from "@/lib/utils";

const glassCard =
  "bg-linear-to-br from-card/60 to-card/20 backdrop-blur-2xl border-white/20 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

interface ExpenseStatsProps {
  workCategoryId: string;
}

export function ExpenseStats({ workCategoryId }: ExpenseStatsProps) {
  const workCategoryIdNum =
    workCategoryId === "all" ? undefined : parseInt(workCategoryId, 10);

  const { data: stats, isLoading } = useExpenseDashboardStats({
    workCategoryId: workCategoryIdNum,
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-14 w-24 mb-5" />
        <div className="flex gap-3 max-w-xl">
          <Skeleton className="h-28 flex-1 rounded-xl" />
          <Skeleton className="h-28 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const theme = getListCardTheme("expense");

  return (
    <div className="mb-6">
      <div className="mb-5 text-center sm:text-left">
        <ModuleHeroLabel variant="expense">Total Expenses</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalExpenses}
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 max-w-xl">
        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Amount
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <DollarSign className={cn("h-4 w-4", theme.statIcon)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tabular-nums">
                {formatCurrency(stats.totalAmount)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Registered This Month
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <CalendarDays className={cn("h-4 w-4", theme.statIcon)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.thisMonthExpenses}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
