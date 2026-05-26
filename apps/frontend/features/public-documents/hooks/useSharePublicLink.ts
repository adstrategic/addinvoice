import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";
import {
  sharePublicLink,
  type SharePublicLinkResource,
} from "../service/share-public-link.service";

export const sharePublicLinkMutationKey = {
  all: ["share-public-link"] as const,
  detail: (resource: SharePublicLinkResource, sequence: number) =>
    [...sharePublicLinkMutationKey.all, resource, sequence] as const,
};

type UseSharePublicLinkOptions = {
  resource: SharePublicLinkResource;
  sequence: number;
  documentLabel: string;
  queryKeysToInvalidate: readonly (readonly unknown[])[];
  onShared?: () => void;
};

export function useSharePublicLink({
  resource,
  sequence,
  documentLabel,
  queryKeysToInvalidate,
  onShared,
}: UseSharePublicLinkOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: sharePublicLinkMutationKey.detail(resource, sequence),
    mutationFn: () => sharePublicLink(resource, sequence),
    onSuccess: () => {
      queryKeysToInvalidate.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
      onShared?.();
      toast.success(`${documentLabel} is ready to share`, {
        description: "Copy the link below and send it to your client.",
      });
    },
    onError: (error) => handleMutationError(error),
  });
}
