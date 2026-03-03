import { useQuery } from "@tanstack/react-query";
import { expensesService } from "../service/expenses.service";
import {
  expenseKeys,
  type ExpenseDashboardStatsParams,
} from "./useExpenses";

export function useExpenseDashboardStats(params?: ExpenseDashboardStatsParams) {
  return useQuery({
    queryKey: expenseKeys.dashboardStats(params),
    queryFn: () => expensesService.getDashboardStats(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
