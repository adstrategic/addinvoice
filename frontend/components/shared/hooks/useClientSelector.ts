import { useState, useCallback } from "react";
import { useClients } from "@/features/clients/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClientResponse } from "@/features/clients";

export const useClientSelector = (initialClient: ClientResponse | null) => {
  // Inicializar con cliente si se proporciona, sino ""
  const [clientQuery, setClientQuery] = useState(initialClient?.name || "");
  const [openClients, setOpenClients] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar el cliente seleccionado completo
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(
    initialClient || null
  );

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(clientQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === clientQuery;

  // Preparar initialData si hay cliente inicial y el usuario no ha interactuado
  const initialData =
    initialClient && !hasUserInteracted
      ? {
          success: true as const,
          data: [initialClient],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar clientes - solo cuando hay interacción del usuario
  const {
    data: clientsData,
    isFetching: loadingClients,
    isFetched,
  } = useClients({
    search: shouldFetch ? debouncedQuery : undefined,
    enabled: shouldFetch,
    initialData, // Solo en modo edit, antes de primera interacción
  });

  // Calcular la lista a mostrar de forma simple
  const clients = clientsData?.data || [];

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
  };
};
