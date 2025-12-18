import { AppLayout } from "@/components/app-layout";
import ClientsContent from "@/features/clients/components/ClientsContent";
import { Suspense } from "react";

export default function ClientsPage() {
  return (
    <AppLayout>
      <ClientsContent />
    </AppLayout>
  );
}
