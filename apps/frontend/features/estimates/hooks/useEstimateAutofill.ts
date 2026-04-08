import { useState, useCallback, useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type {
  CreateEstimateDTO,
  EstimateResponse,
  ClientResponse,
} from "@addinvoice/schemas";

interface UseEstimateAutofillProps {
  estimate: EstimateResponse | null | undefined;
  setValue: UseFormSetValue<CreateEstimateDTO>;
}

interface UseEstimateAutofillReturn {
  // Para el ClienteSelector
  selectedClient: ClientResponse | null;
  handleClientSelect: (client: ClientResponse) => void;
}

/**
 * Hook para manejar el autocompletado de campos cuando se selecciona un cliente.
 *
 * Responsabilidades:
 * 1. Mantener el estado del cliente seleccionado
 * 2. Mantener los objetos de visualización para selectores dependientes (Vendedor, Ciudad)
 * 3. Autocompletar campos del formulario cuando se selecciona un cliente
 *
 * Nota importante sobre displayVendedor y displayCiudad:
 * - Se inicializan con factura.vendedor y factura.ciudad (no con factura.cltemae.vendedor/ciudad)
 * - Esto es intencional para evitar mostrar datos incorrectos en modo edición
 * - Solo se actualizan cuando el usuario SELECCIONA un nuevo cliente
 */
export const useEstimateAutofill = ({
  estimate,
  setValue,
}: UseEstimateAutofillProps): UseEstimateAutofillReturn => {
  // Estado del cliente seleccionado
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(
    estimate?.client || null,
  );

  useEffect(() => {
    if (estimate?.client) {
      setSelectedClient(estimate.client);
    }
  }, [estimate?.client]);

  // Handler unificado para cuando el usuario selecciona un cliente
  const handleClientSelect = useCallback(
    (client: ClientResponse) => {
      setSelectedClient(client);

      // Autocompletar campos del formulario
      if (client.address) {
        setValue("clientAddress", client.address, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (client.phone) {
        setValue("clientPhone", client.phone, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (client.email) {
        setValue("clientEmail", client.email, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [setValue],
  );

  return {
    selectedClient,
    handleClientSelect,
  };
};
