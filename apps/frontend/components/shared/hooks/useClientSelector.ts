import { useMemo, useState, useCallback, useEffect } from "react";
import { useClients } from "@/features/clients/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClientResponse } from "@addinvoice/schemas";

export const useClientSelector = (
  value: number,
  initialClient: ClientResponse | null,
  mode: "create" | "edit",
) => {
  const [openClients, setOpenClients] = useState(false);
  const [clientQuery, setClientQuery] = useState("");

  // Fetch strategy (hybrid): always fetch initial list, then server-search on typing.
  const debouncedQuery = useDebouncedValue(clientQuery, 300);

  const {
    data: clientsData,
    isFetching: loadingClients,
    isFetched,
  } = useClients({
    search: debouncedQuery || undefined,
  });

  const clients = useMemo(() => clientsData?.data || [], [clientsData?.data]);

  const selectedClient = useMemo(() => {
    if (!value || value <= 0) return null;
    if (initialClient?.id === value) return initialClient;
    return clients.find((c) => c.id === value) ?? null;
  }, [value, initialClient, clients]);

  // Keep query aligned with current selected client when parent value changes.
  useEffect(() => {
    setClientQuery(selectedClient?.name ?? "");
  }, [selectedClient?.id, selectedClient?.name]);

  const handleClientSearch = useCallback((query: string) => {
    setClientQuery(query);
  }, []);

  // Función para abrir/cerrar el popover
  const toggleClientPopover = useCallback(
    (open: boolean) => {
      setOpenClients(open);
      if (!open) {
        setClientQuery(selectedClient?.name ?? "");
      }
    },
    [selectedClient],
  );

  const closePopover = useCallback(() => {
    setOpenClients(false);
  }, []);

  return {
    clientQuery,
    openClients,
    clients,
    loadingClients,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    selectedClient,
    handleClientSearch,
    toggleClientPopover,
    closePopover,
    mode,
  };
};
