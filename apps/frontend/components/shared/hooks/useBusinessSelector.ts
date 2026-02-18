import { useState, useCallback, useEffect } from "react";
import { useBusinesses } from "@/features/businesses/hooks/useBusinesses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { BusinessResponse } from "@/features/businesses";

export const useBusinessSelector = (
  initialBusiness: BusinessResponse | null,
  mode: "create" | "edit"
) => {
  // Inicializar con business si se proporciona, sino ""
  const [openBusinesses, setOpenBusinesses] = useState(false);
  const [businessQuery, setBusinessQuery] = useState(initialBusiness?.name || "");
  // Estado para guardar el business seleccionado completo
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(
    initialBusiness || null
  );

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  /**
   * Sync local state when initialBusiness prop changes after component mount.
   *
   * This is useful in scenarios where:
   * 1. Catalog data is refetched (e.g., after creating a new business)
   *    - The catalog response includes the business data
   *    - initialBusiness prop updates with the new business data
   *    - Without this effect, selectedBusiness and businessQuery would remain stale
   *
   * 2. Navigating between different catalogs in edit mode
   *    - Each catalog has a different business
   *    - initialBusiness changes when switching catalogs
   *    - Local state needs to reflect the new catalog's business
   *
   * 3. When parent component updates initialBusiness based on async data
   *    - Data loads asynchronously and initialBusiness starts as null
   *    - Once data arrives, initialBusiness updates
   *    - Local state should sync to show the loaded business
   *
   * Note: useState initializers (lines 12, 14-15) handle the initial value on mount.
   * This effect handles updates to the prop after the component has already mounted.
   */
  useEffect(() => {
    if (initialBusiness) {
      setSelectedBusiness(initialBusiness);
      setBusinessQuery(initialBusiness.name);
      setHasUserInteracted(true);
    }
  }, [initialBusiness]);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(businessQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === businessQuery;

  // Query para buscar businesses - solo cuando hay interacción del usuario
  const {
    data: businessesData,
    isFetching: loadingBusinesses,
    isFetched,
  } = useBusinesses({
    search: shouldFetch ? debouncedQuery : undefined,
  });

  // Calcular la lista a mostrar de forma simple
  const businesses =
    mode === "edit" && !hasUserInteracted
      ? initialBusiness
        ? [initialBusiness]
        : []
      : businessesData?.data || [];

  // Función para manejar la búsqueda de businesses
  const handleBusinessSearch = useCallback((query: string) => {
    setBusinessQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleBusinessPopover = useCallback(
    (open: boolean) => {
      setOpenBusinesses(open);
      // Si se cierra, resetear el query al business seleccionado
      if (!open) {
        setBusinessQuery(selectedBusiness?.name || "");
      }
    },
    [selectedBusiness]
  );

  // Función para manejar la selección de un business
  const handleBusinessSelect = useCallback((business: BusinessResponse) => {
    setSelectedBusiness(business);
    setOpenBusinesses(false);
    // Resetear el query al business seleccionado
    setBusinessQuery(business.name);
  }, []);

  const handleCreateNewBusiness = useCallback(() => {
    setSelectedBusiness(null);
    setOpenBusinesses(false);
    setBusinessQuery("");
  }, []);

  return {
    businessQuery,
    openBusinesses,
    businesses,
    loadingBusinesses,
    hasUserInteracted,
    isFetched,
    selectedBusiness,
    handleBusinessSearch,
    handleBusinessSelect,
    toggleBusinessPopover,
    handleCreateNewBusiness,
  };
};




