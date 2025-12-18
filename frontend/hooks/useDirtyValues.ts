import { useCallback } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Custom hook to extract only dirty (modified) fields from a React Hook Form
 *
 * This is useful for PATCH operations where you only want to send changed data
 * to the backend, reducing payload size and improving performance.
 *
 * @param form - The React Hook Form instance
 * @returns Object with helper functions for dirty field management
 *
 * @example
 * ```tsx
 * const form = useForm<MyFormData>({ ... });
 * const { getDirtyValues, hasDirtyFields } = useDirtyFields(form);
 *
 * const handleSubmit = async (data: MyFormData) => {
 *   const changedData = getDirtyValues(data);
 *   await api.patch('/endpoint', changedData); // Only sends changed fields
 * };
 * ```
 */
export function useDirtyFields<T extends FieldValues>(form: UseFormReturn<T>) {
  /**
   * Get only the fields that have been modified
   * Handles nested objects and arrays by recursively checking dirtyFields
   */
  const getDirtyValues = useCallback(
    (allValues: T): Partial<T> => {
      const dirtyFields = form.formState.dirtyFields;

      // Recursive function to extract dirty values from nested objects
      const extractDirtyValues = (values: any, dirtyFieldsMap: any): any => {
        if (typeof dirtyFieldsMap !== "object" || dirtyFieldsMap === null) {
          return values;
        }

        // Check if we're processing an array
        // Arrays in React Hook Form dirtyFields have numeric keys (indices)
        const isArray = Array.isArray(values);
        const keys = Object.keys(dirtyFieldsMap);

        if (isArray) {
          // If any element in the array is dirty, return the entire array
          // This ensures the backend receives a proper array structure
          const hasAnyDirtyElement = keys.some((key) => {
            const isDirty = dirtyFieldsMap[key];
            return (
              isDirty === true ||
              (typeof isDirty === "object" && isDirty !== null)
            );
          });

          if (hasAnyDirtyElement) {
            return values; // Return the complete array
          }
          // If no elements are dirty, return undefined (don't include in result)
          return undefined;
        }

        // Process as regular object
        return Object.keys(dirtyFieldsMap).reduce((acc: any, key: string) => {
          const isDirty = dirtyFieldsMap[key];
          const value = values[key];

          if (isDirty === true) {
            // Field is dirty, include it
            acc[key] = value;
          } else if (typeof isDirty === "object" && value !== null) {
            // Nested object or array, recurse
            const nestedDirtyValues = extractDirtyValues(value, isDirty);
            // Include if it's an array (with elements) or an object (with keys)
            if (
              nestedDirtyValues !== undefined &&
              (Array.isArray(nestedDirtyValues)
                ? nestedDirtyValues.length > 0
                : Object.keys(nestedDirtyValues).length > 0)
            ) {
              acc[key] = nestedDirtyValues;
            }
          }

          return acc;
        }, {});
      };

      return extractDirtyValues(allValues, dirtyFields);
    },
    [form.formState.dirtyFields]
  );

  /**
   * Check if any fields have been modified
   */
  const hasDirtyFields = form.formState.isDirty;

  /**
   * Get a list of field names that have been modified
   */
  const getDirtyFieldNames = useCallback((): string[] => {
    const dirtyFields = form.formState.dirtyFields;
    return Object.keys(dirtyFields).filter((key) => (dirtyFields as any)[key]);
  }, [form.formState.dirtyFields]);

  /**
   * Check if a specific field is dirty
   */
  const isFieldDirty = useCallback(
    (fieldName: keyof T): boolean => {
      return !!(form.formState.dirtyFields as any)[fieldName as string];
    },
    [form.formState.dirtyFields]
  );

  return {
    getDirtyValues,
    hasDirtyFields,
    getDirtyFieldNames,
    isFieldDirty,
  };
}
