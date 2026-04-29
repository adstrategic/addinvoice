import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  advanceResponseSchema,
  createAdvanceSchema,
  listAdvancesResponseSchema,
  sendAdvanceBodySchema,
  syncAdvanceAttachmentsResponseSchema,
  type AdvanceResponse,
  type CreateAdvanceDTO,
  type ListAdvancesResponse,
  type SendAdvanceDTO,
  type UpdateAdvanceDTO,
} from "@addinvoice/schemas";

const BASE_URL = "/advances";

export type ListAdvancesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  invoiceId?: number;
};

type SyncAttachmentsInput = {
  keptAttachmentIds: number[];
  orderTokens?: string[];
  newFiles: File[];
};

async function list(
  params?: ListAdvancesParams,
): Promise<ListAdvancesResponse> {
  try {
    const { data } = await apiClient.get<ListAdvancesResponse>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        clientId: params?.clientId,
        invoiceId: params?.invoiceId,
      },
    });
    return listAdvancesResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function getById(advanceId: number): Promise<AdvanceResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<AdvanceResponse>>(
      `${BASE_URL}/${advanceId}`,
    );
    return advanceResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get an estimate by ID
 */
async function getAdvanceBySequence(
  sequence: number,
): Promise<AdvanceResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<AdvanceResponse>>(
      `${BASE_URL}/${sequence}`,
    );

    return advanceResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function create(dto: CreateAdvanceDTO): Promise<AdvanceResponse> {
  try {
    const payload = createAdvanceSchema.parse(dto);
    const { data } = await apiClient.post<ApiSuccessResponse<AdvanceResponse>>(
      BASE_URL,
      payload,
    );
    return advanceResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function update(
  advanceId: number,
  dto: UpdateAdvanceDTO,
): Promise<AdvanceResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<AdvanceResponse>>(
      `${BASE_URL}/${advanceId}`,
      dto,
    );
    return advanceResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteById(advanceId: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${advanceId}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function syncAttachments(
  advanceId: number,
  input: SyncAttachmentsInput,
): Promise<
  ReturnType<typeof syncAdvanceAttachmentsResponseSchema.parse>["data"]
> {
  try {
    const formData = new FormData();
    formData.append(
      "keptAttachmentIds",
      JSON.stringify(input.keptAttachmentIds ?? []),
    );
    if (input.orderTokens?.length) {
      formData.append("orderTokens", JSON.stringify(input.orderTokens));
    }
    for (const file of input.newFiles) {
      formData.append("newFiles", file);
    }
    const { data } = await apiClient.post(
      `${BASE_URL}/${advanceId}/attachments/sync`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return syncAdvanceAttachmentsResponseSchema.parse(data).data;
  } catch (error) {
    handleApiError(error);
  }
}

async function sendAdvance(
  advanceId: number,
  payload: SendAdvanceDTO,
): Promise<void> {
  try {
    const body = sendAdvanceBodySchema.parse(payload);
    await apiClient.post(`${BASE_URL}/${advanceId}/send`, body);
  } catch (error) {
    handleApiError(error);
  }
}

export const advancesService = {
  list,
  getById,
  getBySequence: getAdvanceBySequence,
  create,
  update,
  deleteById,
  syncAttachments,
  sendAdvance,
};
