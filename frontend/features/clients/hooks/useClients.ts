import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  type CreateClientDto,
  type UpdateClientDto,
  clientsService,
  ClientResponse,
} from "@/features/clients";
import { ApiSuccessResponse } from "@/lib/api/types";

type ListClientsParams = {
  page?: number;
  search?: string;
  enabled?: boolean;
  initialData?: ApiSuccessResponse<ClientResponse[]>; // Opcional: datos iniciales para React Query
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
    placeholderData: (previousData) => previousData, // Smooth pagination transitions
    enabled,
    initialData,
  });
}

/**
 * Hook to fetch a single client by sequence
 */
export function useClientBySequence(sequence: number | null, enabled: boolean) {
  return useQuery({
    queryKey: clientKeys.bySequence(sequence!),
    queryFn: () => clientsService.getBySequence(sequence!),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new client
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast({
        title: "Client created",
        description: "The client has been added successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
    // This allows the form to show field-specific errors
  });
}

/**
 * Hook to update an existing client
 * Errors are NOT handled here - they are thrown to be handled by the form component
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: "Client updated",
        description: "The client has been updated successfully.",
      });
    },
    // Don't handle errors here - let the form component handle them
  });
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, sequence }: { id: number; sequence: number }) =>
      clientsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });
}
