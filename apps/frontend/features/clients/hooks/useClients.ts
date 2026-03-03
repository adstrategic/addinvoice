import type { UseFormSetError } from "react-hook-form";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  type CreateClientDto,
  type UpdateClientDto,
  clientsService,
} from "@/features/clients";
import type { ClientResponseList } from "../schema/clients.schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

type ListClientsParams = {
  page?: number;
  search?: string;
  enabled?: boolean;
  initialData?: ClientResponseList; // Opcional: datos iniciales para React Query
};

/**
 * Query key factory for client queries
 * Follows TanStack Query best practices for key management
 */
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params?: ListClientsParams) =>
    [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...clientKeys.details(), "sequence", sequence] as const,
};

/**
 * Hook to fetch all clients with pagination and search
 */
export function useClients(params?: ListClientsParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: clientKeys.list(queryParams),
    queryFn: () => clientsService.list(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: keepPreviousData, // Smooth pagination transitions
    enabled,
    initialData,
  });
}

/**
 * Hook to fetch a single client by sequence
 * Uses placeholderData to prevent loading flashes when data exists in cache
 */
export function useClientBySequence(sequence: number | null, enabled: boolean) {
  return useQuery({
    queryKey: clientKeys.bySequence(sequence ?? 0),
    queryFn: () => clientsService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new client.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useCreateClient(setError?: UseFormSetError<CreateClientDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client created", {
        description: "The client has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

/**
 * Hook to update an existing client.
 * Pass setError when used with a form so validation/field errors are set on the form.
 */
export function useUpdateClient(setError?: UseFormSetError<CreateClientDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientDto }) =>
      clientsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.bySequence(variables.id),
      });
      toast.success("Client updated", {
        description: "The client has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

/**
 * Hook to delete a client.
 * Errors are handled by the central dispatcher (handleMutationError).
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      clientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client deleted", {
        description: "The client has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, undefined);
    },
  });
}
