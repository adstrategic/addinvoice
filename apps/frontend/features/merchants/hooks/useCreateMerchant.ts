import type { CreateMerchantInput } from "@addinvoice/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { merchantsService } from "../service/merchants.service";
import { merchantsQueryKey } from "./useMerchants";
import { toast } from "sonner";

export function useCreateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMerchantInput) => merchantsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantsQueryKey });
      toast.success("Merchant created", {
        description: "The merchant has been added successfully.",
      });
    },
  });
}
