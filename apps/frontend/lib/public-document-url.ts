export function buildPublicDocumentUrl(publicSlug: string): string {
  if (typeof window === "undefined") {
    return `/public/${publicSlug}`;
  }
  return `${window.location.origin}/public/${publicSlug}`;
}
