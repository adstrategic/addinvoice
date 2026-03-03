import { useState, useCallback, useEffect } from "react";
import { useMerchants } from "@/features/merchants";
import type { MerchantResponse } from "@/features/merchants";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useMerchantSelector = (
  initialMerchant: MerchantResponse | null,
  mode: "create" | "edit",
) => {
  const [openMerchants, setOpenMerchants] = useState(false);
  const [merchantQuery, setMerchantQuery] = useState(
    initialMerchant?.name || "",
  );
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantResponse | null>(initialMerchant || null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    if (initialMerchant) {
      setSelectedMerchant(initialMerchant);
      setMerchantQuery(initialMerchant.name);
    }
  }, [initialMerchant]);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(merchantQuery, 300);

  const {
    data: merchantsData,
    isFetching: loadingMerchants,
    isFetched,
  } = useMerchants({
    search: debouncedQuery,
  });

  // Calcular la lista a mostrar de forma simple
  const merchants =
    mode === "edit" && !hasUserInteracted
      ? initialMerchant
        ? [initialMerchant]
        : [...(merchantsData?.data || [])]
      : merchantsData?.data || [];

  const handleMerchantSearch = useCallback((query: string) => {
    setMerchantQuery(query);
    setHasUserInteracted((prev) => (prev ? prev : true));
  }, []);

  const toggleMerchantPopover = useCallback(
    (open: boolean) => {
      setOpenMerchants(open);
      if (!open) {
        setMerchantQuery(selectedMerchant?.name || "");
      }
    },
    [selectedMerchant],
  );

  const handleMerchantSelect = useCallback((merchant: MerchantResponse) => {
    setSelectedMerchant(merchant);
    setOpenMerchants(false);
    setMerchantQuery(merchant.name);
  }, []);

  const handleCreateNewMerchant = useCallback(() => {
    setSelectedMerchant(null);
    setOpenMerchants(false);
    setMerchantQuery("");
  }, []);

  const handleSelectNone = useCallback(() => {
    setSelectedMerchant(null);
    setOpenMerchants(false);
    setMerchantQuery("");
  }, []);

  return {
    merchantQuery,
    openMerchants,
    merchants,
    loadingMerchants,
    isFetched,
    hasUserInteracted,
    selectedMerchant,
    handleMerchantSearch,
    handleMerchantSelect,
    toggleMerchantPopover,
    handleCreateNewMerchant,
    handleSelectNone,
  };
};
