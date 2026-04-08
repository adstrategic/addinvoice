import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  AgentLanguage,
  PaymentMethod,
  UpsertPaymentMethodDto,
  PaymentMethodType,
  UpsertWorkspaceLanguageDto,
  WorkspaceLanguageResponse,
} from "../schema/workspace.schema";
import {
  paymentMethodSchema,
  workspaceLanguageResponseSchema,
} from "../schema/workspace.schema";
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

async function getWorkspaceLanguage(): Promise<WorkspaceLanguageResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceLanguageResponse>>(
      `${BASE_URL}/language`,
    );
    return workspaceLanguageResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateWorkspaceLanguage(
  dto: UpsertWorkspaceLanguageDto,
): Promise<WorkspaceLanguageResponse> {
  try {
    const { data } = await apiClient.put<ApiSuccessResponse<WorkspaceLanguageResponse>>(
      `${BASE_URL}/language`,
      dto,
    );
    return workspaceLanguageResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

export const workspaceService = {
  listPaymentMethods,
  upsertPaymentMethod,
  getWorkspaceLanguage,
  updateWorkspaceLanguage,
};
