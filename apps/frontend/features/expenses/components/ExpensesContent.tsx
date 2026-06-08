"use client";

import {
  ExpenseDashboard,
  ExpenseStats,
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
import { useLimitGuard } from "@/hooks/use-limit-guard";

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
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const expenseManager = useExpenseManager();
  const { guardCreate } = useLimitGuard();

  const handleOpenCreateExpense = () => {
    if (guardCreate("expenses")) return;
    expenseManager.openCreate();
  };

  const {
    data: expensesData,
    isLoading,
    isFetching,
    isPlaceholderData,
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

  const isInitialLoad = isLoading && !expensesData;
  const isListLoading = isFetching && isPlaceholderData;

  const expenseDelete = useExpenseDelete();

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !expensesData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading expenses.</p>
        </CardContent>
      </Card>
    );
  }

  const expenses = expensesData.data;
  const pagination = expensesData.pagination;

  return (
    <>
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track and manage your expenses
            </p>
          </div>
          <ExpenseActions onOpenCreateModal={handleOpenCreateExpense} />
        </div>

        <ExpenseStats workCategoryId={workCategoryIdFilter} />

        <ExpenseDashboard workCategoryId={workCategoryIdFilter} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
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

          <ExpenseList
            expenses={expenses}
            isLoading={isListLoading}
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
