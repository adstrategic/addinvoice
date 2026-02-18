import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  PaymentMethod,
  UpsertPaymentMethodDto,
  PaymentMethodType,
} from "../schema/workspace.schema";
import { paymentMethodSchema } from "../schema/workspace.schema";
import { z } from "zod";

const BASE_URL = "/workspace";

/**
 * List all workspace payment methods
 */
async function listPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<PaymentMethod[]>>(
      `${BASE_URL}/payment-methods`,
    );
    return z.array(paymentMethodSchema).parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Upsert a workspace payment method by type
 */
async function upsertPaymentMethod(
  type: PaymentMethodType,
  dto: UpsertPaymentMethodDto,
): Promise<PaymentMethod> {
  try {
    const { data } = await apiClient.put<ApiSuccessResponse<PaymentMethod>>(
      `${BASE_URL}/payment-methods/${type}`,
      dto,
    );
    return paymentMethodSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

export const workspaceService = {
  listPaymentMethods,
  upsertPaymentMethod,
};
