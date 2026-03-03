"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Download,
} from "lucide-react";
import type { ExpenseResponse } from "../schema/expenses.schema";
import { formatCurrency } from "@/lib/utils";

interface ExpenseCardProps {
  expense: ExpenseResponse;
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onDelete: (expense: ExpenseResponse) => void;
}

// TODO change this function
function formatDate(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function ExpenseCard({
  expense,
  onViewDetails,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {expense.merchant?.name ?? "N/A"}
            </p>
            {expense.workCategory && (
              <Badge
                variant="default"
                className="bg-primary/20 text-primary hover:bg-primary/30"
              >
                {expense.workCategory.name}
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(expense.expenseDate)}
            </p>
            {expense.description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">
                {expense.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[60px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {formatCurrency(expense.total)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(expense.sequence)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(expense.sequence)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {expense.image && (
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(expense.image!, {
                      mode: "cors",
                    });
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download =
                      expense.image!.split("/").pop()?.split("?")[0] ||
                      "receipt";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(expense.image!, "_blank");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download receipt
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(expense)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
