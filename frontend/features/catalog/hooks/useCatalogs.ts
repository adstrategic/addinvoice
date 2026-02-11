import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  type CreateCatalogDto,
  type UpdateCatalogDto,
  catalogService,
} from "@/features/catalog";
import { CatalogResponseList } from "../schema/catalog.schema";

type ListCatalogsParams = {
  page?: number;
  search?: string;
  enabled?: boolean;
  initialData?: CatalogResponseList; // Opcional: datos iniciales para React Query
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
  enabled: boolean
) {
  return useQuery({
    queryKey: catalogKeys.bySequence(sequence!),
    queryFn: () => catalogService.getBySequence(sequence!),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new catalog
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCatalogDto) => catalogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      toast({
        title: "Catalog item created",
        description: "The catalog item has been added successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
    // This allows the form to show field-specific errors
  });
}

/**
 * Hook to update an existing catalog
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdateCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: "Catalog item updated",
        description: "The catalog item has been updated successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to delete a catalog
 */
export function useDeleteCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      catalogService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.lists() });
      toast({
        title: "Catalog item deleted",
        description: "The catalog item has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete catalog item",
        variant: "destructive",
      });
    },
  });
}
