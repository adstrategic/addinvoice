import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface UseTabStateOptions {
  defaultValue: string;
  resetPaginationOnChange?: boolean;
}

/**
 * Hook for managing tab state with optional pagination reset.
 * Single Responsibility: Tab state management
 */
export function useTabState(options: UseTabStateOptions) {
  const { defaultValue, resetPaginationOnChange = true } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedTab, setSelectedTab] = useState(defaultValue);

  const setTab = (value: string) => {
    setSelectedTab(value);
    const params = new URLSearchParams(searchParams);

    // Reset to first page when switching tabs (default behavior)
    if (resetPaginationOnChange) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    selectedTab,
    setTab,
  };
}
