import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  estimateResponseSchema,
  type EstimateResponse,
  type EstimateItemResponse,
  estimateItemResponseSchema,
} from "@addinvoice/schemas";

import {
  estimateResponseListSchema,
  type EstimateResponseList,
} from "../schemas/estimate.schema";

/**
 * Base URL for estimates API endpoints
 */
const BASE_URL = "/estimates";

/**
 * List estimates query parameters
 */
export type ListEstimatesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  businessId?: number;
};

export type FromVoiceEstimateResult = {
  estimateNumber: string;
  sequence: number;
};

/**
 * Estimates Service
 * Handles all API calls for estimates feature
 * Follows Service Layer Pattern for separation of concerns
 */

/**
 * List all estimates with pagination and search
 */
async function listEstimates(
  params?: ListEstimatesParams,
): Promise<EstimateResponseList> {
  try {
    const { data } = await apiClient.get<EstimateResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        clientId: params?.clientId,
        businessId: params?.businessId,
      },
    });

    return estimateResponseListSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

/**
 * Get next suggested estimate number for the given business
 */
async function getNextEstimateNumber(businessId: number): Promise<string> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ estimateNumber: string }>
    >(`${BASE_URL}/next-number`, {
      params: { businessId },
    });

    return data.data.estimateNumber;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get an estimate by ID
 */
async function getEstimateBySequence(
  sequence: number,
): Promise<EstimateResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<EstimateResponse>>(
      `${BASE_URL}/${sequence}`,
    );

    return estimateResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a new estimate
 */
async function createEstimate(dto: any): Promise<EstimateResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<EstimateResponse>>(
      BASE_URL,
      dto,
    );

    return estimateResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an existing estimate
 */
async function updateEstimate(id: number, dto: any): Promise<EstimateResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<EstimateResponse>
    >(`${BASE_URL}/${id}`, dto);

    return estimateResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Mark an estimate as accepted
 */
async function markAsAccepted(estimateId: number): Promise<EstimateResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<EstimateResponse>
    >(`${BASE_URL}/${estimateId}/accept`);

    return estimateResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/** Response shape from convert-to-invoice (invoice sequence for redirect) */
export type ConvertEstimateToInvoiceResponse = {
  id: number;
  sequence: number;
  invoiceNumber: string;
};

/**
 * Convert an accepted estimate to an invoice
 */
async function convertEstimateToInvoice(
  sequence: number,
): Promise<ConvertEstimateToInvoiceResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<ConvertEstimateToInvoiceResponse>
    >(`${BASE_URL}/${sequence}/convert-to-invoice`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete an estimate (soft delete)
 */
async function deleteEstimate(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create an estimate item
 */
async function createEstimateItem(
  estimateId: number,
  dto: any,
): Promise<EstimateItemResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<EstimateItemResponse>
    >(`${BASE_URL}/${estimateId}/items`, dto);

    return estimateItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an estimate item
 */
async function updateEstimateItem(
  estimateId: number,
  itemId: number,
  dto: any,
): Promise<EstimateItemResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<EstimateItemResponse>
    >(`${BASE_URL}/${estimateId}/items/${itemId}`, dto);

    return estimateItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete an estimate item
 */
async function deleteEstimateItem(
  estimateId: number,
  itemId: number,
): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${estimateId}/items/${itemId}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a draft estimate from a recorded audio blob (backend: Whisper → Claude + tools).
 */
async function createFromVoiceAudio(params: {
  businessId: number;
  clientId: number;
  audio: Blob;
  mimeType: string;
}): Promise<FromVoiceEstimateResult> {
  const ext = params.mimeType.includes("mp4") ? "mp4" : "webm";
  const formData = new FormData();
  formData.append("audio", params.audio, `recording.${ext}`);
  formData.append("businessId", String(params.businessId));
  formData.append("clientId", String(params.clientId));

  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<FromVoiceEstimateResult>
    >(`${BASE_URL}/from-voice-audio`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!data?.data?.sequence || !data?.data?.estimateNumber) {
      throw new Error(
        "There was an error creating the estimate, please try again.",
      );
    }

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const estimatesService = {
  list: listEstimates,
  getNextEstimateNumber: getNextEstimateNumber,
  getBySequence: getEstimateBySequence,
  create: createEstimate,
  update: updateEstimate,
  markAsAccepted,
  convertToInvoice: convertEstimateToInvoice,
  createFromVoiceAudio,
  delete: deleteEstimate,
  createItem: createEstimateItem,
  updateItem: updateEstimateItem,
  deleteItem: deleteEstimateItem,
};
