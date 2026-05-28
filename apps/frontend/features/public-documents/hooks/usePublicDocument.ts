import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPublicDocumentBySlug,
  getPublicDocumentPdfBySlug,
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

export function usePublicDocumentPdf(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-document-pdf", slug],
    queryFn: () => getPublicDocumentPdfBySlug(slug!),
    enabled: !!slug,
    retry: 1,
  });
}

export function useMarkPublicDocumentViewed(slug: string | undefined) {
  return useMutation({
    mutationFn: () => markPublicDocumentViewed(slug!),
  });
}
