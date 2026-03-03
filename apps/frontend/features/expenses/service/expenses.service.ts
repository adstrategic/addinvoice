import type {
  ReceiptScanResult,
  ListExpensesQuery,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseDashboardStatsResponse,
} from "@addinvoice/schemas";
import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  expenseResponseSchema,
  expenseResponseListSchema,
  type ExpenseResponse,
  type ExpenseResponseList,
} from "../schema/expenses.schema";

export type { ReceiptScanResult };

export type ExpenseDashboardStats = Omit<
  ExpenseDashboardStatsResponse,
  "recentExpenses"
> & { recentExpenses: ExpenseResponse[] };

const BASE_URL = "/expenses";

async function listExpenses(
  params?: ListExpensesQuery,
): Promise<ExpenseResponseList> {
  try {
    const { data } = await apiClient.get<ExpenseResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        workCategoryId: params?.workCategoryId,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
      },
    });
    const validated = expenseResponseListSchema.parse(data);
    return { data: validated.data, pagination: validated.pagination };
  } catch (error) {
    handleApiError(error);
  }
}

async function getExpenseBySequence(
  sequence: number,
): Promise<ExpenseResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<ExpenseResponse>>(
      `${BASE_URL}/${sequence}`,
    );
    return expenseResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function getExpenseDashboardStats(
  params?: { workCategoryId?: number },
): Promise<ExpenseDashboardStats> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<ExpenseDashboardStatsResponse>
    >(`${BASE_URL}/stats`, {
      params: { workCategoryId: params?.workCategoryId },
    });
    const raw = data.data;
    const recentExpenses = Array.isArray(raw.recentExpenses)
      ? raw.recentExpenses.map((e: unknown) => expenseResponseSchema.parse(e))
      : [];
    return {
      totalExpenses: raw.totalExpenses,
      totalAmount: raw.totalAmount,
      thisWeekExpenses: raw.thisWeekExpenses,
      thisMonthExpenses: raw.thisMonthExpenses,
      monthlyExpenses: raw.monthlyExpenses,
      recentExpenses,
    };
  } catch (error) {
    handleApiError(error);
  }
}

async function uploadReceipt(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("receipt", file);
    const { data } = await apiClient.post<{ data: { url: string } }>(
      `${BASE_URL}/upload-receipt`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    const url = data?.data?.url;
    if (typeof url !== "string" || url === "") {
      throw new Error("Invalid upload response: missing url");
    }
    return url;
  } catch (error) {
    handleApiError(error);
  }
}

async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  try {
    const formData = new FormData();
    formData.append("receipt", file);
    const { data } = await apiClient.post<{ data: ReceiptScanResult }>(
      `${BASE_URL}/scan-receipt`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (!data?.data) {
      throw new Error("Invalid scan response");
    }
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

async function createExpense(dto: CreateExpenseDTO): Promise<ExpenseResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<ExpenseResponse>>(
      BASE_URL,
      dto,
    );
    return expenseResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateExpense(
  id: number,
  dto: UpdateExpenseDTO,
): Promise<ExpenseResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<ExpenseResponse>>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return expenseResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteExpense(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

export const expensesService = {
  list: listExpenses,
  getBySequence: getExpenseBySequence,
  getDashboardStats: getExpenseDashboardStats,
  create: createExpense,
  update: updateExpense,
  delete: deleteExpense,
  uploadReceipt,
  scanReceipt,
};
