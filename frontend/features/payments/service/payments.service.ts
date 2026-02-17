import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  paymentListResponseListSchema,
  type PaymentListResponseList,
} from "../schemas/payments.schema";
import {
  paymentDetailResponseSchema,
  type PaymentDetailResponse,
} from "@/features/invoices/schemas/invoice.schema";

const BASE_URL = "/payments";

export type ListPaymentsParams = {
  page?: number;
  limit?: number;
  businessId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

/**
 * List payments for the workspace with optional filters
 */
async function list(
  params?: ListPaymentsParams,
): Promise<PaymentListResponseList> {
  try {
    const { data } = await apiClient.get<PaymentListResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        businessId: params?.businessId,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        search: params?.search,
      },
    });
    return paymentListResponseListSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

/**
 * Get a single payment by ID with full context
 */
async function getById(id: number): Promise<PaymentDetailResponse> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<PaymentDetailResponse>
    >(`${BASE_URL}/${id}`);
    return paymentDetailResponseSchema.parse(data.data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const paymentsService = {
  list,
  getById,
};
