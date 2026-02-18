import { useState } from "react";
import type { InvoiceResponse } from "../schemas/invoice.schema";

/**
 * Hook to manage the "Add Payment" dialog state from the invoice list.
 * Keeps both the selected invoice and dialog open state so the dialog
 * visibility can be controlled independently (e.g. for animations).
 */
export function usePaymentDialog() {
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<InvoiceResponse | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const openPaymentDialog = (invoice: InvoiceResponse) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentDialogOpen(true);
  };

  const closePaymentDialog = () => {
    setSelectedInvoiceForPayment(null);
  };

  return {
    selectedInvoiceForPayment,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    openPaymentDialog,
    closePaymentDialog,
  };
}
