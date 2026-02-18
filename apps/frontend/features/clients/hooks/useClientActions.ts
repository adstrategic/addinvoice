import { useToast } from "@/hooks/use-toast";
import {
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "./useClients";
import { CreateClientDto, UpdateClientDto } from "../schema/clients.schema";

/**
 * Custom hook that encapsulates all client business logic and side effects:
 * - Create/Update/Delete operations
 * - Toast notifications
 * - Success/Error handling
 *
 * This hook follows the Single Responsibility Principle by handling ONLY
 * business logic and side effects, not UI state.
 *
 * @example
 * ```tsx
 * const clientActions = useClientActions();
 *
 * // Create a client
 * await clientActions.handleCreate(formData);
 *
 * // Update a client
 * await clientActions.handleUpdate(clientId, updatedData);
 *
 * // Delete a client
 * await clientActions.handleDelete(clientId, sequence);
 * ```
 */
export function useClientActions() {
  const { toast } = useToast();

  // React Query mutations
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  /**
   * Create a new client
   */
  const handleCreate = async (data: CreateClientDto) => {
    await createMutation.mutateAsync(data);

    toast({
      title: "Client created successfully",
      description: "The client has been added to the system",
    });
  };

  /**
   * Update an existing client
   */
  const handleUpdate = async (id: number, data: UpdateClientDto) => {
    await updateMutation.mutateAsync({ id, data });

    toast({
      title: "Client updated successfully",
      description: "The client has been updated successfully",
    });
  };

  /**
   * Delete a client
   */
  const handleDelete = async (id: number, sequence: number) => {
    try {
      await deleteMutation.mutateAsync({ id, sequence });

      toast({
        title: "Client deleted successfully",
        description: "The client has been deleted from the system",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting client",
        description:
          error.message || "An error occurred while deleting the client",
      });

      // Re-throw to allow caller to handle if needed
      throw error;
    }
  };

  return {
    // Action handlers
    handleCreate,
    handleUpdate,
    handleDelete,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Combined loading state for forms
    isMutating: createMutation.isPending || updateMutation.isPending,
  };
}
