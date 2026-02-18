/**
 * Clients Feature Module
 * Central export point for all clients-related functionality
 *
 * Usage:
 *   import { useClients, ClientForm, type Client } from '@/features/clients'
 */

// Schemas and Types
export {
  createClientSchema,
  updateClientSchema,
  clientResponseSchema,
  clientResponseListSchema,
  type CreateClientDto,
  type UpdateClientDto,
  type ClientResponse,
  type ListClientsParams,
} from "./schema/clients.schema";

// Hooks
export {
  useClients,
  useClientBySequence,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  clientKeys,
} from "./hooks/useClients";

export { useClientActions } from "./hooks/useClientActions";

export { useClientManager } from "./hooks/useClientFormManager";

export { useClientDelete } from "./hooks/useClientDelete";

// Service
export { clientsService } from "./service/clients.service";

// Components
export { ClientCard } from "./components/ClientCard";
export { ClientStats } from "./components/ClientStats";
export { ClientFilters } from "./components/ClientFilters";
export { ClientList } from "./components/ClientList";
export { ClientActions } from "./components/ClientActions";

// Forms
export { ClientForm } from "./forms/ClientForm";
export { ClientFormModal } from "./forms/ClientFormModal";
