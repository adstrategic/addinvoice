import { apiClient } from "@/lib/api/client";
import { handleApiError, ApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  CreateBusinessDto,
  UpdateBusinessDto,
  ListBusinessesParams,
} from "../index";
import {
  businessResponseSchema,
  businessResponseListSchema,
  type BusinessResponse,
  type BusinessResponseList,
} from "../schema/businesses.schema";
import { ZodError } from "zod";

/**
 * Base URL for businesses API endpoints
 */
const BASE_URL = "/businesses";

/**
 * Businesses Service
 * Handles all API calls for businesses feature
 * Follows Service Layer Pattern for separation of concerns
 */

/**
 * List all businesses with pagination and search
 */
async function listBusinesses(
  params?: ListBusinessesParams
): Promise<BusinessResponseList> {
  try {
    const { data } = await apiClient.get<BusinessResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });

    return businessResponseListSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get a business by ID
 */
async function getBusinessById(id: number): Promise<BusinessResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<BusinessResponse>>(
      `${BASE_URL}/${id}`
    );

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a new business
 */
async function createBusiness(
  dto: CreateBusinessDto
): Promise<BusinessResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<BusinessResponse>>(
      BASE_URL,
      dto
    );

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an existing business
 */
async function updateBusiness(
  id: number,
  dto: UpdateBusinessDto
): Promise<BusinessResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<BusinessResponse>
    >(`${BASE_URL}/${id}`, dto);

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete a business (soft delete)
 */
async function deleteBusiness(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Set a business as default
 */
async function setDefaultBusiness(id: number): Promise<BusinessResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<BusinessResponse>
    >(`${BASE_URL}/${id}/default`);

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Upload business logo
 */
async function uploadLogo(id: number, file: File): Promise<BusinessResponse> {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const { data } = await apiClient.post<ApiSuccessResponse<BusinessResponse>>(
      `${BASE_URL}/${id}/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete business logo
 */
async function deleteLogo(id: number): Promise<BusinessResponse> {
  try {
    const { data } = await apiClient.delete<
      ApiSuccessResponse<BusinessResponse>
    >(`${BASE_URL}/${id}/logo`);

    return businessResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const businessesService = {
  list: listBusinesses,
  getById: getBusinessById,
  create: createBusiness,
  update: updateBusiness,
  delete: deleteBusiness,
  setDefault: setDefaultBusiness,
  uploadLogo,
  deleteLogo,
};
