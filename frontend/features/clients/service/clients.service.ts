import { apiClient } from "@/lib/api/client";
import { handleApiError, ApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  CreateClientDto,
  UpdateClientDto,
  ListClientsParams,
} from "../index";
import {
  clientResponseSchema,
  clientResponseListSchema,
  type ClientResponse,
  ClientResponseList,
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
  params?: ListClientsParams
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
      `${BASE_URL}/${sequence}`
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
async function createClient(dto: CreateClientDto): Promise<ClientResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<ClientResponse>>(
      BASE_URL,
      dto
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
  dto: UpdateClientDto
): Promise<ClientResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<ClientResponse>>(
      `${BASE_URL}/${id}`,
      dto
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

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const clientsService = {
  list: listClients,
  getBySequence: getClientBySequence,
  create: createClient,
  update: updateClient,
  delete: deleteClient,
};
