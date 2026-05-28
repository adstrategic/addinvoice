"use client";

import { useParams } from "next/navigation";
import { PublicDocumentPortal } from "@/features/public-documents";

export default function PublicDocumentPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  if (!slug) {
    return null;
  }

  return <PublicDocumentPortal slug={slug} />;
}
