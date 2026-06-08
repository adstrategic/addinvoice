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
import { getWorkCategoryIcon } from "@/features/work-categories";
import type { ExpenseResponse } from "../schema/expenses.schema";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import {
  ListCard,
  ListCardBody,
  ListCardMain,
  ListCardHeaderRow,
  ListCardMeta,
  ListCardMetricGrid,
  ListCardMetricsDesktop,
  ListCardFooter,
  ListCardFooterLabel,
  ListCardFooterValue,
} from "@/components/shared/list-card";

interface ExpenseCardProps {
  expense: ExpenseResponse;
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onDelete: (expense: ExpenseResponse) => void;
}

export function ExpenseCard({
  expense,
  onViewDetails,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const CategoryIcon = expense.workCategory
    ? getWorkCategoryIcon(expense.workCategory.icon)
    : null;

  const merchantName = expense.merchant?.name?.trim();
  const description = expense.description?.trim();
  const expenseTitle =
    merchantName ||
    (!expense.workCategory && description ? description : undefined);
  const showDescription =
    !!description &&
    description !== merchantName &&
    description !== expenseTitle;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-amber-500/10 hover:text-amber-600 transition-colors duration-200"
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
                  expense.image!.split("/").pop()?.split("?")[0] || "receipt";
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
  );

  return (
    <ListCard clickable={false} variant="expense">
      <ListCardBody>
        <ListCardMain icon={Receipt} variant="expense">
          <ListCardHeaderRow
            title={expenseTitle}
            badge={
              expense.workCategory && CategoryIcon ? (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold tracking-wider border-0 shrink-0 bg-amber-500/10 text-amber-700 inline-flex items-center gap-1"
                >
                  <CategoryIcon className="h-3 w-3 shrink-0" />
                  {expense.workCategory.name}
                </Badge>
              ) : undefined
            }
            actions={actionsMenu}
          >
            {showDescription && <ListCardMeta>{description}</ListCardMeta>}
          </ListCardHeaderRow>

          <ListCardMetricGrid
            variant="expense"
            metrics={[
              {
                label: "Total",
                value: formatCurrency(expense.total),
                valueClassName: "text-amber-600",
              },
            ]}
          />
        </ListCardMain>

        <ListCardMetricsDesktop
          metrics={[
            {
              label: "Total",
              value: formatCurrency(expense.total),
              valueClassName: "text-amber-600",
            },
          ]}
          actions={actionsMenu}
        />
      </ListCardBody>

      <ListCardFooter variant="expense" icon={Calendar}>
        <ListCardFooterLabel>Expense date</ListCardFooterLabel>
        <ListCardFooterValue>
          {formatDateOnly(expense.expenseDate)}
        </ListCardFooterValue>
      </ListCardFooter>
    </ListCard>
  );
}
