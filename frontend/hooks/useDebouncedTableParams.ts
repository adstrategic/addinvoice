"use client";

import { useEffect, useState } from "react";
import { usePaginationParams } from "./usePaginationParams";
import { useSearchParam } from "./useSearchParam";
import { useDebouncedValue } from "./useDebouncedValue";

// hooks/useDebouncedTableParams.ts
export function useDebouncedTableParams(delayMs: number = 300) {
  const { currentPage, setPage, resetPage } = usePaginationParams();
  const { searchTerm: urlSearchTerm, setSearch } = useSearchParam();

  // Estado local para input (respuesta inmediata)
  const [localSearch, setLocalSearch] = useState(urlSearchTerm);

  // Debounce del estado local
  const debouncedSearch = useDebouncedValue(localSearch, delayMs);

  // Actualizar URL cuando cambia el debounced
  useEffect(() => {
    if (debouncedSearch !== urlSearchTerm) {
      setSearch(debouncedSearch, true);
    }
  }, [debouncedSearch, urlSearchTerm, setSearch]);

  return {
    currentPage,
    setPage,
    resetPage,
    searchTerm: localSearch, // Para el input
    debouncedSearch, // Para la query
    setSearch: setLocalSearch, // Para actualizar el input
  };
}
