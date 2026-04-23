import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  type CreateCatalogDto,
  type UpdateCatalogDto,
  catalogService,
} from "@/features/catalog";
import type { ListCatalogsParams as ListCatalogsParamsSchema } from "../schema/catalog.schema";
import type { CatalogResponseList } from "../schema/catalog.schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

type ListCatalogsParams = ListCatalogsParamsSchema & {
  enabled?: boolean;
  initialData?: CatalogResponseList;
};

/**
 * Query key factory for catalog queries
 * Follows TanStack Query best practices for key management
 */
export const catalogKeys = {
  all: ["catalogs"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: (params?: ListCatalogsParams) =>
    [...catalogKeys.lists(), params] as const,
  details: () => [...catalogKeys.all, "detail"] as const,
  detail: (id: number) => [...catalogKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...catalogKeys.details(), "sequence", sequence] as const,
};

/**
 * Hook to fetch all catalogs with pagination and search
 */
export function useCatalogs(params?: ListCatalogsParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: catalogKeys.list(queryParams),
    queryFn: () => catalogService.list(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
    enabled,
    initialData,
  });
}

/**
 * Hook to fetch a single catalog by sequence
 */
export function useCatalogBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: catalogKeys.bySequence(sequence!),
    queryFn: () => catalogService.getBySequence(sequence!),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new catalog.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useCreateCatalog(setError?: UseFormSetError<CreateCatalogDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCatalogDto) => catalogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      toast.success("Catalog item created", {
        description: "The catalog item has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useCreateCatalogFromVoiceAudio() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (params: {
      businessId: number;
      audio: Blob;
      mimeType: string;
    }) => catalogService.createFromVoiceAudio(params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      toast.success("Catalog item created from voice", {
        description: `${result.name} is ready in your catalog.`,
      });
      router.push("/catalog");
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}

/**
 * Hook to update an existing catalog.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateCatalog(setError?: UseFormSetError<CreateCatalogDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCatalogDto }) =>
      catalogService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.bySequence(variables.id),
      });
      toast.success("Catalog item updated", {
        description: "The catalog item has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

/**
 * Hook to delete a catalog.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useDeleteCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      catalogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      toast.success("Catalog item deleted", {
        description: "The catalog item has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
