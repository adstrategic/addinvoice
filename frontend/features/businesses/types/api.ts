/**
 * API Response Types for Businesses
 * Types matching the backend API responses
 */

/**
 * Business response from API
 * Matches BusinessEntity from backend
 */
export interface BusinessResponse {
  id: number;
  workspaceId: number;
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  logo: string | null;
  isDefault: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}









