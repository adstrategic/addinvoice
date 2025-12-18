import { useEffect, useState, useCallback } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useFormScroll } from "./useFormScroll";

interface UseFormErrorHandlerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  mode?: "create" | "edit" | "emit";
  entityName?: string; // e.g., "client", "invoice" - for error messages
}

/**
 * Shared hook for handling form errors
 * Extracted from common form patterns for reusability
 *
 * Features:
 * - Field-specific error handling
 * - Root error handling
 * - Smart error clearing on field change
 * - Toast notifications
 * - Automatic scrolling to errors
 */
export function useFormErrorHandler<T extends FieldValues>({
  form,
  mode = "create",
  entityName = "item",
}: UseFormErrorHandlerProps<T>) {
  const { toast } = useToast();
  const { scrollToField, scrollToRootError } = useFormScroll();

  // Track which field caused the backend error for smart clearing
  const [backendErrorField, setBackendErrorField] = useState<string | null>(
    null
  );

  // Smart backend error clearing - only clear when user types in the field that caused the error
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only clear root error on actual user input, not on programmatic changes
      // Skip if name is undefined (bulk updates) or type is undefined (initial render)
      if (!name || !type) return;

      if (form.formState.errors.root) {
        // If we know which field caused the error, only clear when that field changes
        if (backendErrorField) {
          if (name === backendErrorField) {
            form.clearErrors("root");
            setBackendErrorField(null);
          }
        } else {
          // If we don't know the field, clear on any field change
          form.clearErrors("root");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, backendErrorField]);

  /**
   * Handle form errors from API
   * Supports both field-specific errors and general errors
   */
  const handleFormError = useCallback(
    (error: any) => {
      // Check if this is a validation error with field-specific details
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        let hasSetFieldError = false;
        let firstErrorField: string | null = null;

        // Set errors on specific fields
        error.validationErrors.forEach((validationError: any) => {
          const fieldPath = validationError.path[0]; // Get first element of path array
          const message = validationError.message;

          // Check if this field exists in our form
          if (fieldPath && fieldPath in form.getValues()) {
            form.setError(fieldPath as any, {
              type: "manual",
              message: message,
            });
            hasSetFieldError = true;

            // Set the first detected field for smart clearing
            if (!backendErrorField) {
              setBackendErrorField(fieldPath);
            }

            // Track the first error field for scrolling
            if (!firstErrorField) {
              firstErrorField = fieldPath;
            }
          }
        });

        // If we successfully set field errors, scroll to the first one
        if (hasSetFieldError && firstErrorField) {
          scrollToField(firstErrorField);
          return;
        }
      }

      // Fallback: Set a general error on the form (will appear at the top)
      let errorMessage =
        error?.message || `An error occurred while saving the ${entityName}`;

      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });

      // Scroll to the root error alert
      scrollToRootError();
    },
    [form, entityName, backendErrorField, scrollToField, scrollToRootError]
  );

  /**
   * Handle errors with toast notification
   * Wraps handleFormError and adds toast notification
   */
  const handleErrorWithToast = useCallback(
    (error: any) => {
      // Extract error message with priority: validation errors > API errors > generic
      let errorMessage = "An unexpected error occurred";

      if (
        error?.validationErrors &&
        Array.isArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        errorMessage = error.validationErrors[0].message;
      } else {
        errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "An unexpected error occurred";
      }

      // Set form errors (handles field-specific errors and root error)
      handleFormError(error);

      // Show toast notification
      const errorTitle =
        mode === "edit"
          ? `Error updating ${entityName}`
          : mode === "emit"
          ? `Error emitting ${entityName}`
          : `Error creating ${entityName}`;

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    },
    [mode, entityName, handleFormError, toast]
  );

  return {
    handleFormError,
    handleErrorWithToast,
    backendErrorField,
    setBackendErrorField,
  };
}
