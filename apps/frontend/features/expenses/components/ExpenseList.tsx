"use client";

import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseCard } from "./ExpenseCard";
import type { ExpenseResponse } from "../schema/expenses.schema";
import { cn } from "@/lib/utils";

interface ExpenseListProps {
  expenses: ExpenseResponse[];
  isLoading?: boolean;
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onDelete: (expense: ExpenseResponse) => void;
  children?: React.ReactNode;
}

function ExpenseListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading expenses">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ExpenseList({
  expenses,
  isLoading = false,
  onViewDetails,
  onEdit,
  onDelete,
  children,
}: ExpenseListProps) {
  return (
    <div
      data-tour-id="expenses-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <ExpenseListSkeleton />
      ) : expenses.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No expenses found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
