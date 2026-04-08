"use client";

import LoadingComponent from "@/components/loading-component";
import { EstimateForm } from "@/features/estimates/forms/EstimateForm";
import { useEstimateManager } from "@/features/estimates/hooks/useEstimateFormManager";
import { useParams, useRouter } from "next/navigation";

export default function EditEstimatePage() {
  const { sequence } = useParams<{ sequence: string }>();
  const router = useRouter();
  const estimateManager = useEstimateManager({
    mode: "edit",
    sequence: sequence ? parseInt(sequence, 10) : undefined,
  });

  if (
    estimateManager.isLoadingBusinesses ||
    (estimateManager.mode === "edit" && estimateManager.isLoadingEstimate)
  ) {
    return <LoadingComponent variant="form" rows={8} />;
  }

  if (estimateManager.selectedBusiness) {
    return (
      <EstimateForm
        selectedBusiness={estimateManager.selectedBusiness}
        mode={estimateManager.mode}
        form={estimateManager.form}
        onSubmit={estimateManager.onSubmit}
        onCancel={() => router.push("/estimates")}
        existingEstimate={estimateManager.estimate}
        createdClient={estimateManager.createdClient}
        ensureEstimateExists={estimateManager.ensureEstimateExists}
        isLoading={estimateManager.isMutating}
        isLoadingEstimate={estimateManager.isLoadingEstimate}
        isLoadingNumber={estimateManager.isLoadingNextNumber}
        estimateError={estimateManager.estimateError}
        saveBeforeSend={estimateManager.saveBeforeSend}
        saveBeforeOpenSubform={estimateManager.saveBeforeOpenSubform}
        onConvertToInvoice={estimateManager.onConvertToInvoice}
        isConvertingToInvoice={estimateManager.isConvertingToInvoice}
      />
    );
  }
}
