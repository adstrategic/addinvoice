import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateExpenseDTO,
  ListExpensesQuery,
  UpdateExpenseDTO,
} from "@addinvoice/schemas";
import { expensesService } from "../service/expenses.service";
import { merchantsQueryKey } from "@/features/merchants";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export type ExpenseDashboardStatsParams = {
  workCategoryId?: number;
  period?: "7d" | "30d" | "6m" | "12m";
};

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (params?: ListExpensesQuery) =>
    [...expenseKeys.lists(), params] as const,
  dashboardStats: (params?: ExpenseDashboardStatsParams) =>
    [...expenseKeys.all, "dashboardStats", params] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...expenseKeys.details(), "sequence", sequence] as const,
};

export function useExpenses(
  params?: ListExpensesQuery & {
    enabled?: boolean;
  },
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: expenseKeys.list(queryParams),
    queryFn: () => expensesService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

export function useExpenseBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: expenseKeys.bySequence(sequence ?? 0),
    queryFn: () => expensesService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateExpense(setError?: UseFormSetError<CreateExpenseDTO>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: CreateExpenseDTO }) =>
      expensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: merchantsQueryKey() });
      toast.success("Expense created", {
        description: "The expense has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateExpense(setError?: UseFormSetError<CreateExpenseDTO>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      sequence,
    }: {
      id: number;
      data: UpdateExpenseDTO;
      sequence: number;
    }) => expensesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({
        queryKey: expenseKeys.bySequence(variables.sequence),
      });
      queryClient.invalidateQueries({ queryKey: merchantsQueryKey() });
      toast.success("Expense updated", {
        description: "The expense has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number }) => expensesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success("Expense deleted", {
        description: "The expense has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, undefined);
    },
  });
}
