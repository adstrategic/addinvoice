/**
 * Invoices Feature Module
 * Central export point for all invoices-related functionality
 *
 * Usage:
 *   import { useInvoices, InvoiceStats, type InvoiceResponse } from '@/features/invoices'
 */

// Types - Response types from schema, enums and utilities from types/api
export type {
  InvoiceResponse,
  InvoiceItemResponse,
  PaymentResponse,
  InvoiceResponseList,
} from "./schemas/invoice.schema";
export type {
  InvoiceStatus,
  TaxMode,
  QuantityUnit,
  DiscountType,
} from "./types/api";
export type { InvoiceEditorItem } from "./types/editor";
export { mapStatusToUI, mapUIToStatus } from "./types/api";

// Service
export { invoicesService } from "./service/invoices.service";
export type {
  FromVoiceTranscriptResult,
  ListInvoicesParams,
} from "./service/invoices.service";

// Hooks
export {
  useInvoices,
  useInvoiceBySequence,
  useInvoicePdfBytes,
  useCreateInvoice,
  useCreateInvoiceFromVoice,
  useCreateInvoiceFromVoiceAudio,
  useUpdateInvoice,
  useDeleteInvoice,
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
export { VoiceInvoicePromptDialog } from "./components/VoiceInvoicePromptDialog";
export { InvoiceForm } from "./forms/InvoiceForm";
export { ProductFormDialog } from "./components/ProductFormDialog";

// Utils
export { calculateItemTotal, generateInvoicePDF } from "./lib/utils";
