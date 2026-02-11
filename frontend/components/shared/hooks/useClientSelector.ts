import { useState, useCallback, useEffect } from "react";
import { useClients } from "@/features/clients/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClientResponse } from "@/features/clients";

export const useClientSelector = (
  initialClient: ClientResponse | null,
  mode: "create" | "edit"
) => {
  // Inicializar con cliente si se proporciona, sino ""
  const [openClients, setOpenClients] = useState(false);
  const [clientQuery, setClientQuery] = useState(initialClient?.name || "");
  // Estado para guardar el cliente seleccionado completo
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(
    initialClient || null
  );

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  /**
   * Sync local state when initialClient prop changes after component mount.
   *
   * This is useful in scenarios where:
   * 1. Invoice data is refetched (e.g., after creating a new client from invoice form)
   *    - The invoice response includes the newly created client
   *    - initialClient prop updates with the new client data
   *    - Without this effect, selectedClient and clientQuery would remain stale
   *
   * 2. Navigating between different invoices in edit mode
   *    - Each invoice has a different client
   *    - initialClient changes when switching invoices
   *    - Local state needs to reflect the new invoice's client
   *
   * 3. When parent component updates initialClient based on async data
   *    - Data loads asynchronously and initialClient starts as null
   *    - Once data arrives, initialClient updates
   *    - Local state should sync to show the loaded client
   *
   * Note: useState initializers (lines 12, 14-15) handle the initial value on mount.
   * This effect handles updates to the prop after the component has already mounted.
   */
  useEffect(() => {
    if (initialClient) {
      setSelectedClient(initialClient);
      setClientQuery(initialClient.name);
      setHasUserInteracted(true);
    }
  }, [initialClient]);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(clientQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === clientQuery;

  // Query para buscar clientes - solo cuando hay interacción del usuario
  const {
    data: clientsData,
    isFetching: loadingClients,
    isFetched,
  } = useClients({
    search: shouldFetch ? debouncedQuery : undefined,
  });

  // Calcular la lista a mostrar de forma simple
  const clients =
    mode === "edit" && !hasUserInteracted
      ? initialClient
        ? [initialClient]
        : []
      : clientsData?.data || [];

  // Función para manejar la búsqueda de clientes
  const handleClientSearch = useCallback((query: string) => {
    setClientQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleClientPopover = useCallback(
    (open: boolean) => {
      setOpenClients(open);
      // Si se cierra, resetear el query al cliente seleccionado
      if (!open) {
        setClientQuery(selectedClient?.name || "");
      }
    },
    [selectedClient]
  );

  // Función para manejar la selección de un cliente
  const handleClientSelect = useCallback((client: ClientResponse) => {
    setSelectedClient(client);
    setOpenClients(false);
    // Resetear el query al cliente seleccionado
    setClientQuery(client.name);
  }, []);

  const handleCreateNewClient = useCallback(() => {
    setSelectedClient(null);
    setOpenClients(false);
    setClientQuery("");
  }, []);

  return {
    clientQuery,
    openClients,
    clients,
    loadingClients,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedClient,
    handleClientSearch,
    handleClientSelect,
    toggleClientPopover,
    handleCreateNewClient,
  };
};
