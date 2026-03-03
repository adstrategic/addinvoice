import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  merchantResponseListSchema,
  type MerchantResponseList,
  merchantResponseSchema,
  type MerchantResponse,
} from "../schema/merchants.schema";
import {
  type ListMerchantsQuery,
  type CreateMerchantInput,
} from "@addinvoice/schemas";

const BASE_URL = "/merchants";

async function listMerchants(
  query: ListMerchantsQuery,
): Promise<MerchantResponseList> {
  try {
    console.log("query");
    console.log(query);
    const { data } = await apiClient.get<MerchantResponseList>(BASE_URL, {
      params: {
        search: query?.search,
      },
    });
    console.log("data");
    console.log(data);
    const validated = merchantResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.log("error");
    handleApiError(error);
  }
}

async function createMerchant(
  dto: CreateMerchantInput,
): Promise<MerchantResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<MerchantResponse>>(
      BASE_URL,
      dto,
    );
    return merchantResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

export const merchantsService = {
  list: listMerchants,
  create: createMerchant,
};
