/**
 * API Response Types for Clients
 * Types matching the backend API responses
 */

/**
 * Client response from API
 * Matches ClientEntity from backend
 */
export interface ClientResponse {
  id: number;
  sequence: number;
  workspaceId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  nit: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
