import { useToast } from "@/hooks/use-toast";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "./useInvoices";
import { CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice.schema";

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
 * const invoiceActions = useInvoiceActions();
 *
 * // Create a invoice
 * await invoiceActions.handleCreate(formData);
 *
 * // Update a invoice
 * await invoiceActions.handleUpdate(invoiceId, updatedData);
 *
 * // Delete a invoice
 * await invoiceActions.handleDelete(invoiceId, sequence);
 * ```
 */
export function useInvoiceActions() {
  const { toast } = useToast();

  // React Query mutations
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  /**
   * Create a new invoice
   */
  const handleCreate = async (data: CreateInvoiceDTO) => {
    const result = await createMutation.mutateAsync(data);

    toast({
      title: "Invoice created successfully",
      description: "The invoice has been added to the system",
    });

    return result;
  };

  /**
   * Update an existing invoice
   */
  const handleUpdate = async (id: number, data: UpdateInvoiceDTO) => {
    await updateMutation.mutateAsync({ id, data });

    toast({
      title: "Invoice updated successfully",
      description: "The invoice has been updated successfully",
    });
  };

  /**
   * Delete a invoice
   */
  const handleDelete = async (id: number, sequence: number) => {
    try {
      await deleteMutation.mutateAsync({ id, sequence });

      toast({
        title: "Invoice deleted successfully",
        description: "The invoice has been deleted from the system",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting invoice",
        description:
          error.message || "An error occurred while deleting the invoice",
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
