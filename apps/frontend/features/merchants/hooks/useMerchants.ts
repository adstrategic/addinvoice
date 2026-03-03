import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { merchantsService } from "../service/merchants.service";
import type { ListMerchantsQuery } from "@addinvoice/schemas";

export const merchantsQueryKey = (query?: ListMerchantsQuery) =>
  ["merchants", query] as const;

export function useMerchants(query: ListMerchantsQuery) {
  return useQuery({
    queryKey: merchantsQueryKey(query),
    queryFn: () => merchantsService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
