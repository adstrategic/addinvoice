"use client";

import { InvoiceForm } from "@/features/invoices/forms/InvoiceForm";
import { useInvoiceManager } from "@/features/invoices/hooks/useInvoiceFormManager";
import { useParams, useRouter } from "next/navigation";

export default function EditInvoicePage() {
  const { sequence } = useParams<{ sequence: string }>();
  const router = useRouter();
  const invoiceManager = useInvoiceManager({
    mode: "edit",
    sequence: parseInt(sequence),
  });

  return (
    <>
      {invoiceManager.selectedBusiness && (
        <InvoiceForm
          selectedBusiness={invoiceManager.selectedBusiness}
          mode={invoiceManager.mode}
          form={invoiceManager.form}
          onSubmit={invoiceManager.onSubmit}
          onCancel={() => router.push("/invoices")}
          existingInvoice={invoiceManager.invoice}
          ensureInvoiceExists={invoiceManager.ensureInvoiceExists}
          isLoading={invoiceManager.isMutating}
          isLoadingInvoice={invoiceManager.isLoadingInvoice}
          invoiceError={invoiceManager.invoiceError}
        />
      )}
    </>
  );
}
