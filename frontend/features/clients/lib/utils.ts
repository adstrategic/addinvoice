import { CreateClientDto } from "../schema/clients.schema";
import { ClientResponse } from "../types/api";

// Transform API data to form format (for editing)
export function transformFromApiFormat(
  apiData: ClientResponse
): CreateClientDto {
  return {
    name: apiData.name,
    email: apiData.email,
    phone: apiData.phone,
    address: apiData.address,
    nit: apiData.nit,
    businessName: apiData.businessName,
  };
}
