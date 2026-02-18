import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Hook for managing pagination URL parameters.
 * Single Responsibility: Pagination URL parameter management
 */
export function usePaginationParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("page") || "1");

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    currentPage,
    setPage,
    resetPage,
  };
}
