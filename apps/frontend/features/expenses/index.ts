/**
 * Expenses Feature Module
 * Central export point for all expenses-related functionality
 */

export {
  expenseResponseSchema,
  expenseResponseListSchema,
  type ExpenseResponse,
  type ExpenseResponseList,
} from "./schema/expenses.schema";

export {
  useExpenses,
  useExpenseBySequence,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  expenseKeys,
} from "./hooks/useExpenses";
export { useExpenseDashboardStats } from "./hooks/useExpenseDashboardStats";
export { useExpenseActions } from "./hooks/useExpenseActions";
export { useExpenseManager } from "./hooks/useExpenseFormManager";
export { useExpenseDelete } from "./hooks/useExpenseDelete";

export { expensesService } from "./service/expenses.service";

export { ExpenseCard } from "./components/ExpenseCard";
export { ExpenseDashboard } from "./components/ExpenseDashboard";
export { ExpenseStats } from "./components/ExpenseStats";
export { ExpenseFilters } from "./components/ExpenseFilters";
export { ExpenseList } from "./components/ExpenseList";
export { ExpenseActions } from "./components/ExpenseActions";

export { ExpenseForm } from "./forms/ExpenseForm";
export { ExpenseFormModal } from "./forms/ExpenseFormModal";
