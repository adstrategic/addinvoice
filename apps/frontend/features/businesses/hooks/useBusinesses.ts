import type { UseFormSetError } from "react-hook-form";
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
import { handleMutationError } from "@/lib/errors/handle-error";

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
 * Hook to create a new business.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useCreateBusiness(
  setError?: UseFormSetError<CreateBusinessDto>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessDto) => businessesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      toast.success("Business created", {
        description: "The business has been added successfully.",
      });
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to update an existing business.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateBusiness(
  setError?: UseFormSetError<UpdateBusinessDto>,
) {
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
    onError: (err) => handleMutationError(err, setError),
  });
}

/**
 * Hook to delete a business.
 * Errors are handled by the central dispatcher (handleMutationError).
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
    onError: (err) => handleMutationError(err, undefined),
  });
}

/**
 * Hook to set a business as default.
 * Errors are handled by the central dispatcher (handleMutationError).
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
    onError: (err) => handleMutationError(err, undefined),
  });
}

/**
 * Hook to upload business logo.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      businessesService.uploadLogo(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(variables.id),
      });
      toast.success("Logo uploaded", {
        description: "The business logo has been uploaded successfully.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}

/**
 * Hook to delete business logo.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessesService.deleteLogo(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(id),
      });
      toast.success("Logo deleted", {
        description: "The business logo has been deleted successfully.",
      });
    },
    onError: (err) => handleMutationError(err, undefined),
  });
}
