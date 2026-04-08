"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";
import { getWorkCategoryIcon } from "@/features/work-categories";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ExpenseFormModal,
  useExpenseDelete,
  useExpenseManager,
} from "@/features/expenses";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sequence = parseInt(params.sequence as string);

  const expenseDelete = useExpenseDelete({
    onAfterDelete: () => router.push("/expenses"),
  });
  const editExpense = useExpenseManager({
    mode: "edit",
    sequence: sequence,
  });

  const expense = editExpense.expense;

  if (editExpense.isLoadingExpense) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading expense...</p>
        </div>
      </div>
    );
  }

  if (editExpense.expenseError || !expense) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Expense not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/expenses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {expense.merchant?.name ?? "N/A"}
                </h1>
                {expense.workCategory &&
                  (() => {
                    const CategoryIcon = getWorkCategoryIcon(
                      expense.workCategory.icon,
                    );
                    return (
                      <Badge className="bg-primary/20 text-primary inline-flex items-center gap-1">
                        <CategoryIcon className="h-3 w-3 shrink-0" />
                        {expense.workCategory.name}
                      </Badge>
                    );
                  })()}
              </div>
              <p className="text-muted-foreground mt-1">
                {formatDateOnly(expense.expenseDate)} · Expense details
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 bg-transparent"
                  onClick={() => editExpense.openEdit(sequence)}
                >
                  <Edit className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit expense</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 text-destructive hover:text-destructive bg-transparent"
                  onClick={() => expenseDelete.openDeleteModal(expense)}
                >
                  <Trash2 className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete expense</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Expense details
                </h3>
                <p className="text-sm text-muted-foreground">
                  Merchant, amount, and optional fields
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-foreground">
                    {formatDateOnly(expense.expenseDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total
                  </p>
                  <p className="text-foreground font-semibold">
                    {formatCurrency(expense.total)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tax
                  </p>
                  <p className="text-foreground">
                    {formatCurrency(expense.tax ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {(() => {
                  const CategoryIcon = expense.workCategory
                    ? getWorkCategoryIcon(expense.workCategory.icon)
                    : Tag;
                  return (
                    <>
                      <CategoryIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Category
                        </p>
                        <p className="text-foreground flex items-center gap-2">
                          {expense.workCategory ? (
                            <>
                              <CategoryIcon className="h-4 w-4 shrink-0" />
                              {expense.workCategory.name}
                            </>
                          ) : (
                            "None"
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </p>
              <p className="text-foreground whitespace-pre-wrap">
                {expense.description ?? "None"}
              </p>
            </div>
            {expense.image && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Receipt image
                </p>
                <div className="rounded-lg border border-border overflow-hidden bg-muted/30 max-w-md">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Receipt URL may be external (e.g. S3/R2); img works for any origin */}
                  <img
                    src={expense.image}
                    alt="Expense receipt"
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
                <a
                  href={expense.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Open in new tab
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseFormModal
        isOpen={editExpense.isOpen}
        onClose={editExpense.close}
        mode={editExpense.mode}
        initialData={editExpense.expense}
        form={editExpense.form}
        onSubmit={editExpense.onSubmit}
        isLoading={editExpense.isMutating}
        isLoadingExpense={editExpense.isLoadingExpense}
        expenseError={editExpense.expenseError}
        pendingReceiptFile={editExpense.pendingReceiptFile}
        onPendingReceiptFileChange={editExpense.setPendingReceiptFile}
      />

      <EntityDeleteModal
        isOpen={expenseDelete.isDeleteModalOpen}
        onClose={expenseDelete.closeDeleteModal}
        onConfirm={expenseDelete.handleDeleteConfirm}
        entity="expense"
        entityName={
          expenseDelete.expenseToDelete?.description ??
          expense.merchant?.name ??
          "Expense"
        }
        isDeleting={expenseDelete.isDeleting}
      />
    </>
  );
}
