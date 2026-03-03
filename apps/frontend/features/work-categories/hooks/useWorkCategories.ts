import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workCategoriesService } from "../service/work-categories.service";
import type { ListWorkCategoriesQuery } from "@addinvoice/schemas";

export const workCategoriesQueryKey = (query?: ListWorkCategoriesQuery) =>
  ["work-categories", query] as const;

export function useWorkCategories(query?: ListWorkCategoriesQuery) {
  return useQuery({
    queryKey: workCategoriesQueryKey(query),
    queryFn: () => workCategoriesService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
