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
  FileImage,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ExpenseFormModal,
  useExpenseBySequence,
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
import { formatCurrency } from "@/lib/utils";

function formatDate(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

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
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
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
                {expense.workCategory && (
                  <Badge className="bg-primary/20 text-primary">
                    {expense.workCategory.name}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {formatDate(expense.expenseDate)} · Expense details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() => editExpense.openEdit(sequence)}
                >
                  <Edit className="h-4 w-4" />
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
                  className="text-destructive hover:text-destructive bg-transparent"
                  onClick={() => expenseDelete.openDeleteModal(expense)}
                >
                  <Trash2 className="h-4 w-4" />
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
                    {formatDate(expense.expenseDate)}
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
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p className="text-foreground">
                    {expense.workCategory?.name ?? "None"}
                  </p>
                </div>
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
              <div className="pt-4 border-t border-border flex items-start gap-3">
                <FileImage className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Image
                  </p>
                  <a
                    href={expense.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {expense.image}
                  </a>
                </div>
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
