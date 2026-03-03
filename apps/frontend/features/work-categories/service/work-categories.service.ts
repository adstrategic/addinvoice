import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  WorkCategoryResponseList,
} from "../schema/work-categories.schema";
import { workCategoryResponseListSchema } from "../schema/work-categories.schema";
import type { ListWorkCategoriesQuery } from "@addinvoice/schemas";

const BASE_URL = "/work-categories";

async function listWorkCategories(
  query?: ListWorkCategoriesQuery,
): Promise<WorkCategoryResponseList> {
  try {
    const { data } = await apiClient.get<WorkCategoryResponseList>(BASE_URL, {
      params: {
        search: query?.search,
        limit: query?.limit,
        page: query?.page,
      },
    });
    const validated = workCategoryResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    handleApiError(error);
  }
}

export const workCategoriesService = {
  list: listWorkCategories,
};
