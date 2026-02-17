"use client";

import LoadingComponent from "@/components/loading-component";
import { ClientForm } from "@/features/clients/forms/ClientForm";
import { useClientManager } from "@/features/clients/hooks/useClientFormManager";
import { useParams, useRouter } from "next/navigation";

export default function EditClientPage() {
  const { sequence } = useParams<{ sequence: string }>();
  const router = useRouter();
  const clientManager = useClientManager({
    mode: "edit",
    sequence: sequence ? parseInt(sequence, 10) : undefined,
    onAfterSubmit: () => router.push("/clients"),
  });

  if (clientManager.isLoadingClient) {
    return <LoadingComponent variant="form" rows={8} />;
  }

  if (clientManager.clientError || !clientManager.client) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            {clientManager.clientError?.message ?? "Client not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClientForm
      form={clientManager.form}
      mode="edit"
      initialData={clientManager.client}
      onSubmit={clientManager.onSubmit}
      onCancel={() => router.push("/clients")}
      isLoading={clientManager.isMutating}
    />
  );
}
