import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type CreateBusinessDto,
  type UpdateBusinessDto,
  businessesService,
  type BusinessResponse,
  type BusinessResponseList,
} from "@/features/businesses";
import type { ListBusinessesParams as ListBusinessesParamsSchema } from "../schema/businesses.schema";
import { toast } from "sonner";

type ListBusinessesParams = ListBusinessesParamsSchema & {
  enabled?: boolean;
  initialData?: BusinessResponseList;
};

/**
 * Query key factory for business queries
 * Follows TanStack Query best practices for key management
 */
export const businessKeys = {
  all: ["businesses"] as const,
  lists: () => [...businessKeys.all, "list"] as const,
  list: (params?: ListBusinessesParams) =>
    [...businessKeys.lists(), params] as const,
  details: () => [...businessKeys.all, "detail"] as const,
  detail: (id: number) => [...businessKeys.details(), id] as const,
};

/**
 * Hook to fetch all businesses with pagination and search
 */
export function useBusinesses(params?: ListBusinessesParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: businessKeys.list(queryParams),
    queryFn: () => businessesService.list(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
    enabled,
    initialData,
  });
}

/**
 * Hook to fetch a single business by ID
 */
export function useBusiness(id: number | null, enabled = true) {
  return useQuery({
    queryKey: businessKeys.detail(id!),
    queryFn: () => businessesService.getById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new business
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessDto) => businessesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      toast.success("Business created", {
        description: "The business has been added successfully.",
      });
    },
  });
}

/**
 * Hook to update an existing business
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBusinessDto }) =>
      businessesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.id),
      });
      toast.success("Business updated", {
        description: "The business has been updated successfully.",
      });
    },
  });
}

/**
 * Hook to delete a business
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      toast.success("Business deleted", {
        description: "The business has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete business", {
        description: error.message || "Failed to delete business",
      });
    },
  });
}

/**
 * Hook to set a business as default
 */
export function useSetDefaultBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessesService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      toast.success("Default business updated", {
        description: "The default business has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to set default business", {
        description: error.message || "Failed to set default business",
      });
    },
  });
}

/**
 * Hook to upload business logo
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      businessesService.uploadLogo(id, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.id),
      });
      toast.success("Logo uploaded", {
        description: "The business logo has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Upload failed", {
        description: error.message || "Failed to upload logo",
      });
    },
  });
}

/**
 * Hook to delete business logo
 */
export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessesService.deleteLogo(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables),
      });
      toast.success("Logo deleted", {
        description: "The business logo has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete logo", {
        description: error.message || "Failed to delete logo",
      });
    },
  });
}
