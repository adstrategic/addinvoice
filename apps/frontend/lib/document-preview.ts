/**
 * Shared types and fetch helpers for document image previews.
 */

export interface DocumentPreviewPageMeta {
  page: number;
  width: number;
  height: number;
}

export interface DocumentPreviewMetadata {
  hash: string;
  pages: DocumentPreviewPageMeta[];
}

interface PreviewApiResponse {
  data: DocumentPreviewMetadata;
}

export async function fetchPreviewMetadata(
  url: string,
  headers?: HeadersInit,
): Promise<DocumentPreviewMetadata> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to load document preview");
  }
  const body = (await response.json()) as PreviewApiResponse;
  if (!body.data?.hash || !Array.isArray(body.data.pages)) {
    throw new Error("Invalid preview response");
  }
  return body.data;
}

/**
 * Fetch an authenticated preview page and return a blob: URL.
 * Caller must revoke the URL when done.
 */
export async function fetchPreviewPageBlobUrl(
  url: string,
  headers?: HeadersInit,
): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to load preview page");
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function buildPreviewPageUrl(
  baseUrl: string,
  page: number,
  hash: string,
): string {
  const url = new URL(baseUrl.replace(/\/$/, "") + `/${String(page)}`);
  url.searchParams.set("hash", hash);
  return url.toString();
}
