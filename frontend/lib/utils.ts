import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Generate page numbers for pagination
export const getPageNumbers = (totalPages: number, currentPage: number) => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages <= 1) {
    // Only one page or no pages
    return [1];
  }

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination with ellipsis
    if (currentPage <= 3) {
      // Near start: show 1, 2, 3, ..., last
      for (let i = 1; i <= 3; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: show 1, ..., last-2, last-1, last
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle: show 1, ..., current-1, current, current+1, ..., last
      pages.push(1);
      pages.push("ellipsis");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
  }

  return pages;
};

// Generic helper for nullable optional fields that converts empty strings to null
export const nullableOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    schema.nullable(),
  );
