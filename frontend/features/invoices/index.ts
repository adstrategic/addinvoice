/**
 * Invoices Feature Module
 * Central export point for all invoices-related functionality
 *
 * Usage:
 *   import { useInvoices, InvoiceStats, type InvoiceResponse } from '@/features/invoices'
 */

// Types
export type {
  InvoiceResponse,
  InvoiceItemResponse,
  PaymentResponse,
  InvoiceStatus,
  TaxMode,
  QuantityUnit,
  DiscountType,
  InvoiceClientInfo,
} from "./types/api";
export { mapStatusToUI, mapUIToStatus } from "./types/api";

// Service
export { invoicesService } from "./service/invoices.service";
export type { ListInvoicesParams } from "./service/invoices.service";

// Hooks
export {
  useInvoices,
  useInvoiceBySequence,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useMarkInvoiceAsPaid,
  invoiceKeys,
} from "./hooks/useInvoices";

export { useInvoiceActions } from "./hooks/useInvoiceActions";
export { useInvoiceDelete } from "./hooks/useInvoiceDelete";
export {
  useCreateInvoiceItem,
  useUpdateInvoiceItem,
  useDeleteInvoiceItem,
} from "./hooks/useInvoiceItems";
export {
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from "./hooks/usePayments";

// Components
export { default as InvoicesContent } from "./components/InvoicesContent";
export { InvoiceStats } from "./components/InvoiceStats";
export { InvoiceFilters } from "./components/InvoiceFilters";
export { InvoiceList } from "./components/InvoiceList";
export { InvoiceCard } from "./components/InvoiceCard";
export { InvoiceActions } from "./components/InvoiceActions";
export { InvoicePDFPreview } from "./components/InvoicePDFPreview";
export { InvoiceForm } from "./forms/InvoiceForm";
export { ProductFormDialog } from "./components/ProductFormDialog";

// Utils
export { calculateItemTotal, generateInvoicePDF } from "./lib/utils";
