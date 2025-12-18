import { useCallback } from "react";

/**
 * Shared hook for scrolling to form fields
 * Extracted from common form patterns for reusability
 *
 * @returns Function to scroll to a field by name
 */
export function useFormScroll() {
  /**
   * Scroll to a specific field (useful for validation errors)
   * Smoothly scrolls to the field and focuses it
   */
  const scrollToField = useCallback((fieldName: string) => {
    // Use setTimeout to ensure the error is rendered in the DOM first
    setTimeout(() => {
      const element = document.querySelector(`[name="${fieldName}"]`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Focus the field for better UX
        if (element instanceof HTMLElement) {
          // Small delay to ensure scroll completes before focus
          setTimeout(() => {
            element.focus();
          }, 100);
        }
      }
    }, 100);
  }, []);

  /**
   * Scroll to root error alert
   * Useful when there's a general form error
   */
  const scrollToRootError = useCallback(() => {
    setTimeout(() => {
      const alertElement = document.querySelector('[role="alert"]');

      if (alertElement) {
        alertElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  }, []);

  return {
    scrollToField,
    scrollToRootError,
  };
}
