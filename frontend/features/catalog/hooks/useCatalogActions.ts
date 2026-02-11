import { useToast } from "@/hooks/use-toast";
import {
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
} from "./useCatalogs";
import { CreateCatalogDto, UpdateCatalogDto } from "../schema/catalog.schema";

/**
 * Custom hook that encapsulates all catalog business logic and side effects:
 * - Create/Update/Delete operations
 * - Toast notifications
 * - Success/Error handling
 *
 * This hook follows the Single Responsibility Principle by handling ONLY
 * business logic and side effects, not UI state.
 *
 * @example
 * ```tsx
 * const catalogActions = useCatalogActions();
 *
 * // Create a catalog
 * await catalogActions.handleCreate(formData);
 *
 * // Update a catalog
 * await catalogActions.handleUpdate(catalogId, updatedData);
 *
 * // Delete a catalog
 * await catalogActions.handleDelete(catalogId, sequence);
 * ```
 */
export function useCatalogActions() {
  const { toast } = useToast();

  // React Query mutations
  const createMutation = useCreateCatalog();
  const updateMutation = useUpdateCatalog();
  const deleteMutation = useDeleteCatalog();

  /**
   * Create a new catalog
   */
  const handleCreate = async (data: CreateCatalogDto) => {
    await createMutation.mutateAsync(data);

    toast({
      title: "Catalog item created successfully",
      description: "The catalog item has been added to the system",
    });
  };

  /**
   * Update an existing catalog
   */
  const handleUpdate = async (id: number, data: UpdateCatalogDto) => {
    await updateMutation.mutateAsync({ id, data });

    toast({
      title: "Catalog item updated successfully",
      description: "The catalog item has been updated successfully",
    });
  };

  /**
   * Delete a catalog
   */
  const handleDelete = async (id: number, sequence: number) => {
    try {
      await deleteMutation.mutateAsync({ id, sequence });

      toast({
        title: "Catalog item deleted successfully",
        description: "The catalog item has been deleted from the system",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting catalog item",
        description:
          error.message || "An error occurred while deleting the catalog item",
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

