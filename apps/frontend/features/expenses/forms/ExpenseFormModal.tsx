"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "./ExpenseForm";
import type { CreateExpenseDTO } from "@addinvoice/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingComponent from "@/components/loading-component";
import type { ExpenseResponse } from "../schema/expenses.schema";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: ExpenseResponse;
  form: UseFormReturn<CreateExpenseDTO>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingExpense?: boolean;
  expenseError?: Error | null;
  pendingReceiptFile: File | null;
  onPendingReceiptFileChange: (file: File | null) => void;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingExpense = false,
  expenseError = null,
  pendingReceiptFile,
  onPendingReceiptFileChange,
}: ExpenseFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Expense" : "Edit Expense";

  if (expenseError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={expenseError}
            entityName="Expense"
            url={{ path: "/expenses", displayText: "Back to Expenses" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingExpense && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 py-4">
              <LoadingComponent variant="form" rows={8} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-4">
            <ExpenseForm
              form={form}
              mode={mode}
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              pendingReceiptFile={pendingReceiptFile}
              onPendingReceiptFileChange={onPendingReceiptFileChange}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
