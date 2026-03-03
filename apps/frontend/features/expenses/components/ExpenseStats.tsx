"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, DollarSign, Plus } from "lucide-react";
import type { ExpenseResponse } from "../schema/expenses.schema";

interface ExpenseStatsProps {
  expenses: ExpenseResponse[];
}

function formatTotal(value: number | string): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function ExpenseStats({ expenses }: ExpenseStatsProps) {
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce(
    (sum, e) => sum + formatTotal(e.total),
    0,
  );
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = expenses.filter((e) => {
    if (!e.createdAt) return false;
    const d = new Date(e.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
          <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {totalExpenses}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            Total Amount
          </CardTitle>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            New This Month
          </CardTitle>
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {newThisMonth}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
