import { apiClient } from "@/lib/api/client";
import {
  sharePublicLinkResponseSchema,
  type SharePublicLinkResponse,
} from "@addinvoice/schemas";

export type SharePublicLinkResource =
  | "advances"
  | "invoices"
  | "estimates"
  | "proposals";

export async function sharePublicLink(
  resource: SharePublicLinkResource,
  sequence: number,
): Promise<SharePublicLinkResponse> {
  const { data } = await apiClient.post<{ data: unknown }>(
    `/${resource}/${sequence}/share-link`,
  );
  return sharePublicLinkResponseSchema.parse(data.data);
}
