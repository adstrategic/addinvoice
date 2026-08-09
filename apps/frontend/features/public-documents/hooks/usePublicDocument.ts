import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPublicDocumentBySlug,
  getPublicDocumentPreviewBySlug,
  markPublicDocumentViewed,
} from "../service/public-documents.service";

export function usePublicDocument(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-document", slug],
    queryFn: () => getPublicDocumentBySlug(slug!),
    enabled: !!slug,
    retry: false,
  });
}

export function usePublicDocumentPreview(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-document-preview", slug],
    queryFn: () => getPublicDocumentPreviewBySlug(slug!),
    enabled: !!slug,
    retry: 1,
    staleTime: 60 * 1000,
  });
}

export function useMarkPublicDocumentViewed(slug: string | undefined) {
  return useMutation({
    mutationFn: () => markPublicDocumentViewed(slug!),
  });
}
