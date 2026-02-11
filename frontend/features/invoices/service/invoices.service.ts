import { apiClient } from "@/lib/api/client";
import { handleApiError, ApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import {
  invoiceResponseSchema,
  invoiceResponseListSchema,
  invoiceItemResponseSchema,
  paymentResponseSchema,
  type InvoiceResponse,
  type InvoiceItemResponse,
  type PaymentResponse,
  type InvoiceResponseList,
} from "../schemas/invoice.schema";
import { ZodError, z } from "zod";

/**
 * Base URL for invoices API endpoints
 */
const BASE_URL = "/invoices";

/**
 * List invoices query parameters
 */
export type ListInvoicesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  businessId?: number;
};

/**
 * Invoices Service
 * Handles all API calls for invoices feature
 * Follows Service Layer Pattern for separation of concerns
 */

/**
 * List all invoices with pagination and search
 */
async function listInvoices(
  params?: ListInvoicesParams,
): Promise<InvoiceResponseList> {
  try {
    const { data } = await apiClient.get<InvoiceResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        clientId: params?.clientId,
        businessId: params?.businessId,
      },
    });

    return invoiceResponseListSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

/**
 * Get next suggested invoice number
 */
async function getNextInvoiceNumber(): Promise<string> {
  try {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ invoiceNumber: string }>
    >(`${BASE_URL}/next-number`);

    return data.data.invoiceNumber;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get an invoice by ID
 */
async function getInvoiceBySequence(
  sequence: number,
): Promise<InvoiceResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<InvoiceResponse>>(
      `${BASE_URL}/${sequence}`,
    );

    console.log("data", data.data);

    return invoiceResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a new invoice
 */
async function createInvoice(
  dto: any,
): Promise<InvoiceResponse & { items: InvoiceItemResponse[] }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<InvoiceResponse & { items: InvoiceItemResponse[] }>
    >(BASE_URL, dto);

    const invoiceSchema = invoiceResponseSchema.extend({
      items: z.array(invoiceItemResponseSchema),
    });

    return invoiceSchema.parse(data.data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

/**
 * Update an existing invoice
 */
async function updateInvoice(
  id: number,
  dto: any,
): Promise<InvoiceResponse & { items: InvoiceItemResponse[] }> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<InvoiceResponse & { items: InvoiceItemResponse[] }>
    >(`${BASE_URL}/${id}`, dto);

    const invoiceSchema = invoiceResponseSchema.extend({
      items: z.array(invoiceItemResponseSchema),
    });
    return invoiceSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete an invoice (soft delete)
 */
async function deleteInvoice(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create an invoice item
 */
async function createInvoiceItem(
  invoiceId: number,
  dto: any,
): Promise<InvoiceItemResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<InvoiceItemResponse>
    >(`${BASE_URL}/${invoiceId}/items`, dto);

    return invoiceItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update an invoice item
 */
async function updateInvoiceItem(
  invoiceId: number,
  itemId: number,
  dto: any,
): Promise<InvoiceItemResponse> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<InvoiceItemResponse>
    >(`${BASE_URL}/${invoiceId}/items/${itemId}`, dto);

    return invoiceItemResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete an invoice item
 */
async function deleteInvoiceItem(
  invoiceId: number,
  itemId: number,
): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${invoiceId}/items/${itemId}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Create a payment
 */
async function createPayment(
  invoiceId: number,
  dto: any,
): Promise<PaymentResponse> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<PaymentResponse>>(
      `${BASE_URL}/${invoiceId}/payments`,
      dto,
    );

    return paymentResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Update a payment
 */
async function updatePayment(
  invoiceId: number,
  paymentId: number,
  dto: any,
): Promise<PaymentResponse> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<PaymentResponse>>(
      `${BASE_URL}/${invoiceId}/payments/${paymentId}`,
      dto,
    );

    return paymentResponseSchema.parse(data.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Delete a payment
 */
async function deletePayment(
  invoiceId: number,
  paymentId: number,
): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${invoiceId}/payments/${paymentId}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const invoicesService = {
  list: listInvoices,
  getNextInvoiceNumber: getNextInvoiceNumber,
  getBySequence: getInvoiceBySequence,
  create: createInvoice,
  update: updateInvoice,
  delete: deleteInvoice,
  createItem: createInvoiceItem,
  updateItem: updateInvoiceItem,
  deleteItem: deleteInvoiceItem,
  createPayment: createPayment,
  updatePayment: updatePayment,
  deletePayment: deletePayment,
};
