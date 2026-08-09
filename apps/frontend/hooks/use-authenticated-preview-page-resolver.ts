"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import {
  buildPreviewPageUrl,
  fetchPreviewPageBlobUrl,
} from "@/lib/document-preview";

/**
 * Returns a stable resolvePageSrc for authenticated preview page images.
 */
export function useAuthenticatedPreviewPageResolver(
  previewBaseUrl: string | null,
  hash: string | undefined,
) {
  const { getToken } = useAuth();

  return useCallback(
    async (page: number) => {
      if (!previewBaseUrl || !hash) {
        throw new Error("Preview is not ready");
      }
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const url = buildPreviewPageUrl(previewBaseUrl, page, hash);
      return fetchPreviewPageBlobUrl(url, {
        Authorization: `Bearer ${token}`,
      });
    },
    [getToken, previewBaseUrl, hash],
  );
}
