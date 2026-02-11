import { AppLayout } from "@/components/app-layout";
import CatalogContent from "@/features/catalog/components/CatalogContent";
import { Suspense } from "react";

export default function CatalogPage() {
  return (
    <AppLayout>
      <CatalogContent />
    </AppLayout>
  );
}
