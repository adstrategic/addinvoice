import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Hook for managing search URL parameter with pagination reset.
 * Single Responsibility: Search URL parameter management
 */
export function useSearchParam(paramName: string = "search") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get(paramName) || ""
  );

  const setSearch = (value: string, resetPagination: boolean = true) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    // Reset to first page when searching (default behavior)
    if (resetPagination) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    searchTerm,
    setSearch,
  };
}
