import { apiClient } from "@/lib/api/client";
import { handleApiError, ApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  CreateCatalogDto,
  UpdateCatalogDto,
  ListCatalogsParams,
} from "../index";
import {
  catalogResponseSchema,
  catalogResponseListSchema,
  type CatalogResponse,
  CatalogResponseList,
} from "../schema/catalog.schema";

/**
 * Base URL for catalog API endpoints
 */
const BASE_URL = "/catalog";

/**
 * Catalog Service
 * Handles all API calls for catalog feature
 * Follows Service Layer Pattern for separation of concerns
 */

/**
 * List all catalogs with pagination and search
 */
async function listCatalogs(
  params?: ListCatalogsParams,
): Promise<CatalogResponseList> {
  try {
    const { data } = await apiClient.get<CatalogResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        businessId: params?.businessId,
        sortBy: params?.sortBy ?? "sequence",
        sortOrder: params?.sortOrder ?? "asc",
      },
    });

    const validatedData = catalogResponseListSchema.parse(data);
    return {
      data: validatedData.data,
      pagination: validatedData.pagination,
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get a catalog by sequence number
 */
async function getCatalogBySequence(
  sequence: number,
): Promise<CatalogResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<CatalogResponse>>(
      `${BASE_URL}/${sequence}`,
    );

    // Validate response data with Zod
    return catalogResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a new catalog
 */
async function createCatalog(dto: CreateCatalogDto): Promise<CatalogResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<CatalogResponse>>(
      BASE_URL,
      dto,
    );

    // Validate response data with Zod
    return catalogResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an existing catalog
 */
async function updateCatalog(
  id: number,
  dto: UpdateCatalogDto,
): Promise<CatalogResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<CatalogResponse>>(
      `${BASE_URL}/${id}`,
      dto,
    );

    // Validate response data with Zod
    return catalogResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete a catalog (soft delete)
 */
async function deleteCatalog(id: number): Promise<void> {
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
export const catalogService = {
  list: listCatalogs,
  getBySequence: getCatalogBySequence,
  create: createCatalog,
  update: updateCatalog,
  delete: deleteCatalog,
};
