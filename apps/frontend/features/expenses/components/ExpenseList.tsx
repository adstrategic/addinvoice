"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { ExpenseCard } from "./ExpenseCard";
import type { ExpenseResponse } from "../schema/expenses.schema";

interface ExpenseListProps {
  expenses: ExpenseResponse[];
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onDelete: (expense: ExpenseResponse) => void;
  children: React.ReactNode;
}

export function ExpenseList({
  children,
  expenses,
  onViewDetails,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
          All Expenses
          <span className="text-muted-foreground font-normal ml-2">
            ({expenses.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No expenses found matching your filters
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
