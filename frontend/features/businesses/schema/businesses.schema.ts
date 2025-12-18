/**
 * Business Schema Types
 * Type definitions for business forms and validation
 */

/**
 * Create business DTO
 */
export interface CreateBusinessDto {
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  logo?: string | null;
}

/**
 * Update business DTO
 */
export interface UpdateBusinessDto {
  name?: string;
  nit?: string;
  address?: string;
  email?: string;
  phone?: string;
  logo?: string | null;
}

/**
 * List businesses params
 */
export interface ListBusinessesParams {
  page?: number;
  limit?: number;
  search?: string;
}









