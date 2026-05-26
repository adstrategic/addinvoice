import { publicApiClient } from "@/lib/api/public-client";
import {
  publicDocumentSummarySchema,
  type PublicDocumentSummary,
} from "@addinvoice/schemas";

const PUBLIC_DOCUMENTS_BASE = "/public/documents";

export async function getPublicDocumentBySlug(
  slug: string,
): Promise<PublicDocumentSummary> {
  const { data } = await publicApiClient.get<{ data: unknown }>(
    `${PUBLIC_DOCUMENTS_BASE}/${encodeURIComponent(slug)}`,
  );
  return publicDocumentSummarySchema.parse(data.data);
}

export async function getPublicDocumentPdfBySlug(
  slug: string,
): Promise<Uint8Array> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/documents/${encodeURIComponent(slug)}/pdf`,
  );

  if (!response.ok) {
    throw new Error("Failed to load PDF preview");
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function markPublicDocumentViewed(slug: string): Promise<void> {
  await publicApiClient.post(
    `${PUBLIC_DOCUMENTS_BASE}/${encodeURIComponent(slug)}/view`,
  );
}
