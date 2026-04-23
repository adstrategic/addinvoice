import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  clientResponseSchema,
  type ClientResponse,
  type CreateClientDTO,
  type UpdateClientDTO,
} from "@addinvoice/schemas";
import {
  clientResponseListSchema,
  type ClientResponseList,
  type ListClientsParams,
} from "../schema/clients.schema";

/**
 * Base URL for clients API endpoints
 */
const BASE_URL = "/clients";

/**
 * Clients Service
 * Handles all API calls for clients feature
 * Follows Service Layer Pattern for separation of concerns
 */

/**
 * List all clients with pagination and search
 */
async function listClients(
  params?: ListClientsParams,
): Promise<ClientResponseList> {
  try {
    const { data } = await apiClient.get<ClientResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });

    const validatedData = clientResponseListSchema.parse(data);
    return {
      data: validatedData.data,
      pagination: validatedData.pagination,
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get a client by sequence number
 */
async function getClientBySequence(sequence: number): Promise<ClientResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<ClientResponse>>(
      `${BASE_URL}/${sequence}`,
    );

    // Validate response data with Zod
    return clientResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a new client
 */
async function createClient(dto: CreateClientDTO): Promise<ClientResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<ClientResponse>>(
      BASE_URL,
      dto,
    );

    // Validate response data with Zod
    return clientResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an existing client
 */
async function updateClient(
  id: number,
  dto: UpdateClientDTO,
): Promise<ClientResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<ClientResponse>>(
      `${BASE_URL}/${id}`,
      dto,
    );

    // Validate response data with Zod
    return clientResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete a client (soft delete)
 */
async function deleteClient(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

export type FromVoiceClientResult = {
  name: string;
  sequence: number;
};

/**
 * Create one client from recorded audio (backend: Whisper → Claude + tools).
 */
async function createFromVoiceAudio(params: {
  audio: Blob;
  mimeType: string;
}): Promise<FromVoiceClientResult> {
  const ext = params.mimeType.includes("mp4") ? "mp4" : "webm";
  const formData = new FormData();
  formData.append("audio", params.audio, `recording.${ext}`);

  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<FromVoiceClientResult>
    >(`${BASE_URL}/from-voice-audio`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!data?.data?.sequence || !data?.data?.name) {
      throw new Error(
        "There was an error creating the client, please try again.",
      );
    }

    return data.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const clientsService = {
  list: listClients,
  getBySequence: getClientBySequence,
  create: createClient,
  createFromVoiceAudio,
  update: updateClient,
  delete: deleteClient,
};
