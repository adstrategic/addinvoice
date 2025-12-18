/**
 * API Response Types for Invoices
 * Types matching the backend API responses
 */

import { BusinessResponse } from "@/features/businesses";
import { ClientResponse } from "@/features/clients";

/**
 * Invoice status enum matching backend
 */
export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE";

/**
 * Tax mode enum matching backend
 */
export type TaxMode = "BY_PRODUCT" | "BY_TOTAL" | "NONE";

/**
 * Quantity unit enum matching backend
 */
export type QuantityUnit = "DAYS" | "HOURS" | "UNITS";

/**
 * Discount type enum matching backend
 */
export type DiscountType = "PERCENTAGE" | "FIXED" | "NONE";

/**
 * Invoice item response from API
 * Matches InvoiceItemEntity from backend
 */
export interface InvoiceItemResponse {
  id: number;
  invoiceId: number;
  name: string;
  description: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  unitPrice: number;
  discount: number;
  discountType: DiscountType;
  tax: number;
  vatEnabled: boolean;
  total: number;
  catalogId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment response from API
 * Matches PaymentEntity from backend
 */
export interface PaymentResponse {
  id: number;
  workspaceId: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  details: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Client info in invoice response
 */
export interface InvoiceClientInfo {
  id: number;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  nit: string;
}

/**
 * Invoice response from API
 * Matches InvoiceEntity from backend
 */
export interface InvoiceResponse {
  id: number;
  workspaceId: number;
  clientId: number;
  businessId: number;
  sequence: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  purchaseOrder: string | null;
  customHeader: string | null;
  currency: string;
  subtotal: number;
  totalTax: number;
  discount: number;
  discountType: string | null;
  taxMode: TaxMode;
  taxName: string | null;
  taxPercentage: number | null;
  total: number;
  notes: string | null;
  terms: string | null;
  paymentLink: string | null;
  paymentProvider: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Relations
  business: BusinessResponse;
  client: ClientResponse;
  items?: InvoiceItemResponse[];
  payments?: PaymentResponse[];
}

/**
 * Map backend status to UI status string
 */
export function mapStatusToUI(status: InvoiceStatus): string {
  const statusMap: Record<InvoiceStatus, string> = {
    DRAFT: "draft",
    SENT: "issued",
    VIEWED: "issued",
    PAID: "paid",
    OVERDUE: "pending",
  };
  return statusMap[status] || "draft";
}

/**
 * Map UI status string to backend status
 */
export function mapUIToStatus(uiStatus: string): InvoiceStatus | null {
  const statusMap: Record<string, InvoiceStatus> = {
    draft: "DRAFT",
    issued: "SENT",
    pending: "OVERDUE",
    paid: "PAID",
  };
  return statusMap[uiStatus] || null;
}
