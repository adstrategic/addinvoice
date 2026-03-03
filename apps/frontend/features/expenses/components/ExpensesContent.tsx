"use client";

import {
  ExpenseDashboard,
  ExpenseList,
  ExpenseFilters,
  useExpenses,
  ExpenseFormModal,
  useExpenseManager,
  useExpenseDelete,
  ExpenseActions,
} from "@/features/expenses";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const CATEGORY_PARAM = "category";
const DATE_FROM_PARAM = "dateFrom";
const DATE_TO_PARAM = "dateTo";

export default function ExpensesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const workCategoryIdFilter = searchParams.get(CATEGORY_PARAM) ?? "all";
  const dateFrom = searchParams.get(DATE_FROM_PARAM) ?? undefined;
  const dateTo = searchParams.get(DATE_TO_PARAM) ?? undefined;

  const setFilterParams = useCallback(
    (updates: {
      category?: string;
      dateFrom?: string | null;
      dateTo?: string | null;
    }) => {
      const params = new URLSearchParams(searchParams);
      if (updates.category !== undefined) {
        if (updates.category === "all" || !updates.category) {
          params.delete(CATEGORY_PARAM);
        } else {
          params.set(CATEGORY_PARAM, updates.category);
        }
      }
      if (updates.dateFrom !== undefined) {
        if (updates.dateFrom) params.set(DATE_FROM_PARAM, updates.dateFrom);
        else params.delete(DATE_FROM_PARAM);
      }
      if (updates.dateTo !== undefined) {
        if (updates.dateTo) params.set(DATE_TO_PARAM, updates.dateTo);
        else params.delete(DATE_TO_PARAM);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const expenseManager = useExpenseManager();

  const {
    data: expensesData,
    isLoading,
    error,
  } = useExpenses({
    page: currentPage,
    search: debouncedSearch || undefined,
    workCategoryId:
      workCategoryIdFilter === "all"
        ? undefined
        : parseInt(workCategoryIdFilter, 10),
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const expenseDelete = useExpenseDelete();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !expensesData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading expenses. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expenses = expensesData.data;
  const pagination = expensesData.pagination;

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track and manage your expenses
            </p>
          </div>
          <ExpenseActions onOpenCreateModal={expenseManager.openCreate} />
        </div>

        <ExpenseDashboard workCategoryId={workCategoryIdFilter} />

        <ExpenseFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          workCategoryId={workCategoryIdFilter}
          onWorkCategoryIdChange={(value) =>
            setFilterParams({ category: value })
          }
          dateFrom={dateFrom ?? undefined}
          dateTo={dateTo ?? undefined}
          onDateRangeChange={(from, to) =>
            setFilterParams({ dateFrom: from ?? null, dateTo: to ?? null })
          }
        />

        <div id="expenses-list">
          <ExpenseList
            expenses={expenses}
            onViewDetails={(sequence) => router.push(`/expenses/${sequence}`)}
            onEdit={expenseManager.openEdit}
            onDelete={expenseDelete.openDeleteModal}
          >
            {pagination && (
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
                emptyMessage="No expenses found"
                itemLabel="expenses"
              />
            )}
          </ExpenseList>
        </div>
      </div>

      <ExpenseFormModal
        isOpen={expenseManager.isOpen}
        onClose={expenseManager.close}
        mode={expenseManager.mode}
        initialData={expenseManager.expense}
        form={expenseManager.form}
        onSubmit={expenseManager.onSubmit}
        isLoading={expenseManager.isMutating}
        isLoadingExpense={expenseManager.isLoadingExpense}
        expenseError={expenseManager.expenseError}
        pendingReceiptFile={expenseManager.pendingReceiptFile}
        onPendingReceiptFileChange={expenseManager.setPendingReceiptFile}
      />

      <EntityDeleteModal
        isOpen={expenseDelete.isDeleteModalOpen}
        onClose={expenseDelete.closeDeleteModal}
        onConfirm={expenseDelete.handleDeleteConfirm}
        entity="expense"
        entityName={expenseDelete.expenseToDelete?.description || ""}
        isDeleting={expenseDelete.isDeleting}
      />
    </>
  );
}
