/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Prisma } from "@addinvoice/db";
import type { EstimateResponse } from "@addinvoice/schemas";

import { prisma } from "@addinvoice/db";

import type {
  CreatePaymentDto,
  PaymentEntity,
  UpdatePaymentDto,
} from "../payments/payments.schemas.js";
import type {
  CreateInvoiceDto,
  CreateInvoiceItemDto,
  InvoiceEntity,
  InvoiceEntityWithRelations,
  InvoiceItemEntity,
  ListInvoicesQuery,
  UpdateInvoiceDto,
  UpdateInvoiceItemDto,
} from "./invoices.schemas.js";

import {
  EntityNotFoundError,
  EntityValidationError,
  FieldValidationError,
} from "../../errors/EntityErrors.js";
import { type BusinessEntity } from "../businesses/businesses.schemas.js";
import { type ClientEntity } from "../clients/clients.schemas.js";

// ===== HELPER FUNCTIONS =====

/**
 * Create an invoice from an accepted estimate.
 *
 * Used by the estimates conversion flow. If a transaction client is provided,
 * all writes are performed inside that transaction.
 */
export async function createInvoiceFromEstimate(
  workspaceId: number,
  estimate: EstimateResponse,
  tx?: Prisma.TransactionClient,
): Promise<InvoiceEntityWithRelations> {
  const client = tx ?? prisma;

  const business = await client.business.findFirst({
    where: { id: estimate.businessId, workspaceId },
  });
  if (!business) {
    throw new EntityValidationError(
      "Business not found or does not belong to your workspace",
    );
  }

  const invoiceCreated = await client.invoice.create({
    data: {
      workspaceId,
      businessId: estimate.businessId,
      clientId: estimate.clientId,
      currency: estimate.currency,
      // TODO: add these fields correctly
      // clientEmail: estimate.client.email,
      // invoiceNumber: estimate.estimateNumber,
      // sequence: estimate.sequence,
      notes: estimate.notes ?? null,
      terms: estimate.terms ?? null,
      status: "DRAFT",
      // issue/due dates are required for invoices in some flows; set to today by default.
      issueDate: new Date(),
      dueDate: new Date(),
      discount: 0,
      discountType: "NONE",
      subtotal: 0,
      totalTax: 0,
      total: 0,
      balance: 0,
      items: {
        create: (estimate.items ?? []).map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          quantityUnit: item.quantityUnit,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          tax: item.tax,
          vatEnabled: item.vatEnabled,
          total: item.total,
          catalogId: item.catalogId ?? null,
        })),
      },
    },
    include: {
      business: true,
      client: true,
      items: true,
      payments: true,
    },
  });

  return {
    ...invoiceCreated,
    balance: Number(invoiceCreated.balance),
    business: {
      ...invoiceCreated.business,
      defaultTaxMode: invoiceCreated.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: invoiceCreated.business.defaultTaxPercentage
        ? Number(invoiceCreated.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(invoiceCreated.discount),
    items: invoiceCreated.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    payments: invoiceCreated.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    subtotal: Number(invoiceCreated.subtotal),
    taxPercentage: invoiceCreated.taxPercentage
      ? Number(invoiceCreated.taxPercentage)
      : null,
    total: Number(invoiceCreated.total),
    totalTax: Number(invoiceCreated.totalTax),
  };
}

/**
 * Payload for the pdf-service POST /generate-receipt endpoint.
 * Shape must match pdf-service receiptPdfPayloadSchema.
 */
export interface ReceiptPdfPayload {
  client: { email: null | string; name: string };
  company: { address: null | string; logo: null | string; name: string };
  invoice: {
    balance: number;
    currency: string;
    invoiceNumber: string;
    status: string;
    total: number;
    totalPaid: number;
  };
  payment: {
    amount: number;
    date: string;
    id: string;
    method: string;
    notes: null | string;
  };
  payments: { amount: number; date: string; method: string }[];
}

/**
 * Add an invoice item
 */
export async function addInvoiceItem(
  workspaceId: number,
  invoiceId: number,
  data: Omit<CreateInvoiceItemDto, "invoiceId">,
): Promise<InvoiceItemEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError("Cannot add item to a non-draft invoice");
    }

    // Handle catalog integration if needed
    let catalogId: null | number = null;

    // If catalogId is provided directly, use it (when adding from existing catalog)
    if (data.catalogId) {
      // Verify catalog exists and belongs to the invoice's business
      const catalog = await tx.catalog.findUnique({
        where: { id: data.catalogId },
      });

      if (!catalog) {
        throw new EntityNotFoundError("Catalog item not found");
      }

      if (catalog.businessId !== invoice.businessId) {
        throw new EntityValidationError(
          "Catalog item does not belong to the invoice's business",
        );
      }

      catalogId = data.catalogId;
    } else if (data.saveToCatalog) {
      // Create new catalog entry or link to existing one by name
      catalogId = await handleCatalogIntegration(
        tx,
        workspaceId,
        invoice.businessId,
        {
          description: data.description,
          name: data.name,
          price: data.unitPrice,
          quantityUnit: data.quantityUnit,
        },
      );
    }

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = data.taxMode ?? invoice.taxMode;

    // Prepare invoice update data for tax-related fields
    const invoiceUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
    } = {};

    // If taxMode was passed and differs from invoice, update the invoice
    if (data.taxMode && data.taxMode !== invoice.taxMode) {
      invoiceUpdateData.taxMode = data.taxMode;
    }

    // If taxMode is BY_TOTAL and taxName/taxPercentage are provided, update them
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (data.taxName !== undefined || data.taxPercentage !== undefined)
    ) {
      if (data.taxName !== undefined) {
        invoiceUpdateData.taxName = data.taxName;
      }
      if (data.taxPercentage !== undefined) {
        invoiceUpdateData.taxPercentage = data.taxPercentage;
      }
    }

    // Update invoice if there are tax-related changes
    if (Object.keys(invoiceUpdateData).length > 0) {
      await tx.invoice.update({
        data: invoiceUpdateData,
        where: { id: invoiceId },
      });
    }

    // Respect effective taxMode when setting tax fields
    let itemTax = 0;
    let itemVatEnabled = false;
    if (effectiveTaxMode === "BY_PRODUCT") {
      // Use tax field, ignore vatEnabled
      itemTax = data.tax ?? 0;
      itemVatEnabled = false;
    } else if (effectiveTaxMode === "BY_TOTAL") {
      // Use vatEnabled field, set tax to invoice taxPercentage for display if vatEnabled
      itemVatEnabled = data.vatEnabled ?? false;
      itemTax =
        itemVatEnabled && invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : 0;
    } else {
      // taxMode is NONE - both should be defaults
      itemTax = 0;
      itemVatEnabled = false;
    }

    // Calculate item total
    const itemTotal = calculateItemTotal({
      discount: data.discount,
      discountType: data.discountType,
      quantity: data.quantity,
      tax: itemTax,
      unitPrice: data.unitPrice,
      vatEnabled: itemVatEnabled,
    });

    // Create item
    const item = await tx.invoiceItem.create({
      data: {
        catalogId,
        description: data.description,
        discount: data.discount,
        discountType: data.discountType,
        invoiceId,
        name: data.name,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        tax: itemTax,
        total: itemTotal,
        unitPrice: data.unitPrice,
        vatEnabled: itemVatEnabled,
      },
    });

    // Recalculate invoice totals
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
    });

    // Use updated taxPercentage if provided, otherwise use invoice's current value
    const effectiveTaxPercentage =
      data.taxPercentage !== undefined
        ? data.taxPercentage
        : invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : null;

    const totals = calculateInvoiceTotals(
      {
        discount: Number(invoice.discount),
        discountType: invoice.discountType,
        taxMode: effectiveTaxMode,
        taxPercentage: effectiveTaxPercentage,
      },
      allItems.map((i) => ({
        discount: Number(i.discount),
        discountType: i.discountType,
        quantity: Number(i.quantity),
        tax: Number(i.tax),
        unitPrice: Number(i.unitPrice),
        vatEnabled: i.vatEnabled,
      })),
    );

    // Prepare final invoice update data
    const finalInvoiceUpdateData: {
      subtotal: number;
      taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
      total: number;
      totalTax: number;
    } = {
      subtotal: totals.subtotal,
      taxMode: effectiveTaxMode, // Ensure taxMode is updated along with totals
      total: totals.total,
      totalTax: totals.totalTax,
    };

    // Include taxName and taxPercentage if they were provided and taxMode is BY_TOTAL
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (data.taxName !== undefined || data.taxPercentage !== undefined)
    ) {
      if (data.taxName !== undefined) {
        finalInvoiceUpdateData.taxName = data.taxName;
      }
      if (data.taxPercentage !== undefined) {
        finalInvoiceUpdateData.taxPercentage = data.taxPercentage;
      }
    }

    await tx.invoice.update({
      data: finalInvoiceUpdateData,
      where: { id: invoiceId },
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);

    return {
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    };
  });
}

/**
 * Add a payment to an invoice.
 * If data.sendReceipt is true, enqueues a job to send a receipt email (not persisted).
 */
export async function addPayment(
  workspaceId: number,
  invoiceId: number,
  data: CreatePaymentDto,
): Promise<PaymentEntity> {
  const { sendReceipt, ...paymentData } = data;

  const payment = await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      include: { _count: { select: { items: true } } },
      where: { id: invoiceId },
    });

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (invoice._count.items === 0) {
      throw new EntityValidationError(
        "Cannot add payment to an invoice with no items",
      );
    }

    if (Number(invoice.balance) <= 0) {
      throw new EntityValidationError(
        "Cannot add payment: invoice balance is zero or already paid",
      );
    }

    // Check if transactionId already exists only when provided
    const transactionId = paymentData.transactionId ?? null;

    // Create payment
    const created = await tx.payment.create({
      data: {
        amount: paymentData.amount,
        details: paymentData.details,
        invoiceId,
        paidAt: paymentData.paidAt ?? new Date(),
        paymentMethod: paymentData.paymentMethod,
        transactionId,
        workspaceId,
      },
    });

    // Update invoice balance and status
    await updateInvoiceBalanceAndStatus(tx, invoiceId, Number(invoice.total));

    return {
      ...created,
      amount: Number(created.amount),
    } as PaymentEntity;
  });

  if (sendReceipt) {
    const { sendReceiptQueue } = await import("../../queue/queues.js");
    await sendReceiptQueue.add("send-receipt", {
      invoiceId,
      paymentId: payment.id,
      workspaceId,
    });
  }

  return payment;
}

/**
 * Build the payload expected by the PDF service for invoice generation.
 * Used by the controller (getInvoicePdf) and by the send-invoice queue worker.
 */
export function buildInvoicePdfPayload(invoice: InvoiceEntityWithRelations): {
  client: ClientEntity;
  company: BusinessEntity;
  invoice: Omit<InvoiceEntity, "dueDate" | "issueDate"> & {
    dueDate: string;
    issueDate: string;
    totalPaid?: number;
  };
  items: InvoiceItemEntity[];
  paymentMethod: null | { handle: null | string; type: string };
} {
  const invoiceDiscountFixed =
    invoice.discountType === "PERCENTAGE"
      ? (invoice.subtotal * invoice.discount) / 100
      : invoice.discountType === "FIXED"
        ? invoice.discount
        : 0;

  const {
    business: _business,
    client: _client,
    items: _invoiceItems,
    payments: _payments,
    selectedPaymentMethod: _selectedPm,
    ...invoiceFields
  } = invoice;

  return {
    client: {
      ...invoice.client,
      address: invoice.client.address ?? null,
      businessName: invoice.client.businessName ?? null,
      email: invoice.client.email,
      name: invoice.client.name,
      nit: invoice.client.nit ?? null,
      phone: invoice.client.phone ?? null,
    },
    company: {
      ...invoice.business,
      address: invoice.business.address,
      defaultTaxPercentage: invoice.business.defaultTaxPercentage ?? null,
      email: invoice.business.email,
      logo: invoice.business.logo ?? null,
      name: invoice.business.name,
      nit: invoice.business.nit ?? null,
      phone: invoice.business.phone,
    },
    invoice: {
      ...invoiceFields,
      balance: invoice.balance,
      currency: invoice.currency,
      discount: invoiceDiscountFixed,
      dueDate: invoice.dueDate.toISOString(),
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString(),
      notes: invoice.notes,
      purchaseOrder: invoice.purchaseOrder,
      subtotal: invoice.subtotal,
      taxPercentage: invoice.taxPercentage ?? null,
      terms: invoice.terms,
      total: invoice.total,
      totalPaid: (invoice.payments ?? []).reduce((sum, p) => sum + p.amount, 0),
      totalTax: invoice.totalTax,
    },
    items: (invoice.items ?? []).map((item) => {
      const base = item.quantity * item.unitPrice;
      const discountAmount =
        item.discountType === "PERCENTAGE"
          ? (base * item.discount) / 100
          : item.discountType === "FIXED"
            ? item.discount
            : 0;
      return {
        ...item,
        discount: discountAmount,
        quantity: item.quantity,
        tax: item.tax ?? 0,
        total: item.total,
        unitPrice: item.unitPrice,
      };
    }),
    paymentMethod:
      invoice.selectedPaymentMethod &&
      invoice.selectedPaymentMethod.isEnabled &&
      invoice.selectedPaymentMethod.handle?.trim()
        ? {
            handle: invoice.selectedPaymentMethod.handle.trim(),
            type: invoice.selectedPaymentMethod.type,
          }
        : null,
  };
}

/**
 * Build the payload for pdf-service receipt PDF generation.
 * Used by the send-receipt queue worker.
 */
export function buildReceiptPdfPayload(
  invoice: InvoiceEntityWithRelations,
  payment: PaymentEntity,
): ReceiptPdfPayload {
  const totalPaid = (invoice.payments ?? []).reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const formatDate = (d: Date | string | undefined) =>
    d ? new Date(d).toLocaleDateString() : "";

  return {
    client: {
      email: invoice.clientEmail ?? null,
      name: invoice.client.name,
    },
    company: {
      address: invoice.business.address,
      logo: invoice.business.logo ?? null,
      name: invoice.business.name,
    },
    invoice: {
      balance: invoice.balance,
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      total: invoice.total,
      totalPaid,
    },
    payment: {
      amount: payment.amount,
      date: formatDate(payment.paidAt),
      id: String(payment.id),
      method: payment.paymentMethod,
      notes: payment.details ?? null,
    },
    payments: (invoice.payments ?? [])
      .slice()
      .sort((a, b) => {
        const pa = a.paidAt;
        const pb = b.paidAt;
        return (
          (pb ? new Date(pb).getTime() : 0) - (pa ? new Date(pa).getTime() : 0)
        );
      })
      .map((p) => ({
        amount: p.amount,
        date: formatDate(p.paidAt),
        method: p.paymentMethod,
      })),
  };
}

/**
 * Calculate item total with discount and tax
 */
export function calculateItemTotal(
  item: {
    discount: number;
    discountType: "FIXED" | "NONE" | "PERCENTAGE";
    quantity: number;
    tax: number;
    unitPrice: number;
    vatEnabled: boolean;
  },
  // invoiceTaxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE",
  // invoiceTaxPercentage: null | number,
): number {
  // 1. Base amount: quantity × unitPrice
  const baseAmount = item.quantity * item.unitPrice;

  // 2. Apply item discount
  let itemTotalAfterDiscount = baseAmount;
  if (item.discountType === "PERCENTAGE") {
    itemTotalAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
  } else if (item.discountType === "FIXED") {
    itemTotalAfterDiscount = baseAmount - item.discount;
  }

  // TODO: Do not apply tax here
  // 3. Apply tax
  // let taxAmount = 0;
  // if (invoiceTaxMode === "BY_PRODUCT") {
  //   // Use item's tax percentage on item total after discount
  //   taxAmount = (itemTotalAfterDiscount * item.tax) / 100;
  // } else if (
  //   invoiceTaxMode === "BY_TOTAL" &&
  //   item.vatEnabled &&
  //   invoiceTaxPercentage
  // ) {
  //   // Use invoice tax percentage on items with vatEnabled = true
  //   taxAmount = (itemTotalAfterDiscount * invoiceTaxPercentage) / 100;
  // }

  // 4. Final item total without tax so the tax is not added in the item but on the invoice level
  return itemTotalAfterDiscount;
}

/**
 * Create a new invoice with items
 */
export async function createInvoice(
  workspaceId: number,
  data: CreateInvoiceDto,
): Promise<InvoiceEntityWithRelations> {
  return await prisma.$transaction(async (tx) => {
    // Check if workspace has at least one business
    const businessCount = await tx.business.count({
      where: {
        workspaceId,
      },
    });

    if (businessCount === 0) {
      throw new EntityValidationError(
        "You must create a business before creating invoices. Please complete the setup first.",
      );
    }

    const business = await tx.business.findFirst({
      where: {
        id: data.businessId,
        workspaceId,
      },
    });

    if (!business) {
      throw new EntityValidationError(
        "Business not found or does not belong to your workspace",
      );
    }

    // Generate invoice number if not provided
    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = await getNextInvoiceNumber(tx, business.id, workspaceId);
    } else {
      // Check if invoice number already exists
      const existing = await tx.invoice.findUnique({
        where: {
          workspaceId_businessId_invoiceNumber: {
            businessId: data.businessId,
            invoiceNumber,
            workspaceId,
          },
        },
      });
      if (existing) {
        throw new FieldValidationError({
          fields: { invoiceNumber: ["Invoice number already exists"] },
          message: "Invoice number already exists",
          statusCode: 400,
        });
      }
    }

    // Create invoice items with calculations
    const itemsToCreate = data.items
      ? await Promise.all(
          data.items.map(async (item) => {
            // Handle catalog integration if needed
            let catalogId: null | number = null;

            // If catalogId is provided directly, use it (when adding from existing catalog)
            if (item.catalogId) {
              // Verify catalog exists and belongs to the business
              const catalog = await tx.catalog.findUnique({
                where: { id: item.catalogId },
              });

              if (!catalog) {
                throw new EntityNotFoundError("Catalog item not found");
              }

              if (catalog.businessId !== data.businessId) {
                throw new EntityValidationError(
                  "Catalog item does not belong to the selected business",
                );
              }

              catalogId = item.catalogId;
            } else if (item.saveToCatalog) {
              // Create new catalog entry or link to existing one by name
              catalogId = await handleCatalogIntegration(
                tx,
                workspaceId,
                data.businessId,
                {
                  description: item.description,
                  name: item.name,
                  price: item.unitPrice,
                  quantityUnit: item.quantityUnit,
                },
              );
            }

            // Determine item tax value based on taxMode
            let itemTax = 0;
            const itemVatEnabled = item.vatEnabled ?? false;
            if (data.taxMode === "BY_PRODUCT") {
              itemTax = item.tax ?? 0;
            } else if (data.taxMode === "BY_TOTAL") {
              // For BY_TOTAL mode, set tax to invoice taxPercentage for display if vatEnabled
              itemTax =
                itemVatEnabled && data.taxPercentage ? data.taxPercentage : 0;
            }

            // Calculate item total
            const itemTotal = calculateItemTotal({
              discount: item.discount,
              discountType: item.discountType,
              quantity: item.quantity,
              tax: itemTax,
              unitPrice: item.unitPrice,
              vatEnabled: itemVatEnabled,
            });

            return {
              catalogId,
              description: item.description,
              discount: item.discount,
              discountType: item.discountType,
              name: item.name,
              quantity: item.quantity,
              quantityUnit: item.quantityUnit,
              tax: itemTax,
              total: itemTotal,
              unitPrice: item.unitPrice,
              vatEnabled: itemVatEnabled,
            };
          }),
        )
      : [];

    // Calculate invoice totals
    const totals = calculateInvoiceTotals(
      {
        discount: data.discount,
        discountType: data.discountType,
        taxMode: data.taxMode,
        taxPercentage: data.taxPercentage ?? null,
      },
      itemsToCreate,
    );

    // Get next sequence
    const lastInvoice = await tx.invoice.findFirst({
      orderBy: {
        sequence: "desc",
      },
      where: {
        workspaceId,
      },
    });
    const sequence = lastInvoice ? lastInvoice.sequence + 1 : 1;

    // Handle client creation or selection
    let clientId: number;
    let client: {
      address: null | string;
      email: string;
      id: number;
      phone: null | string;
    };

    if (data.createClient && data.clientData) {
      // Create new client within the transaction
      // Get next client sequence
      const lastClient = await tx.client.findFirst({
        orderBy: {
          sequence: "desc",
        },
        select: {
          sequence: true,
        },
        where: {
          workspaceId,
        },
      });
      const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

      // Create the client
      const newClient = await tx.client.create({
        data: {
          address: data.clientData.address,
          businessName: data.clientData.businessName,
          email: data.clientData.email,
          name: data.clientData.name,
          nit: data.clientData.nit,
          phone: data.clientData.phone,
          reminderAfterDueIntervalDays:
            data.clientData.reminderAfterDueIntervalDays,
          reminderBeforeDueIntervalDays:
            data.clientData.reminderBeforeDueIntervalDays,
          sequence: clientSequence,
          workspaceId,
        },
      });

      clientId = newClient.id;
      client = {
        address: newClient.address,
        email: newClient.email,
        id: newClient.id,
        phone: newClient.phone,
      };
    } else {
      // Use existing client
      if (!data.clientId) {
        throw new EntityValidationError(
          "Client ID is required when not creating a new client",
        );
      }

      const existingClient = await tx.client.findUnique({
        where: { id: data.clientId },
      });

      if (!existingClient) {
        throw new EntityValidationError("Client not found");
      }

      clientId = existingClient.id;
      client = {
        address: existingClient.address,
        email: existingClient.email,
        id: existingClient.id,
        phone: existingClient.phone,
      };
    }

    // Use provided invoice-specific fields or fallback to client defaults
    const clientEmail = client.email;
    const clientPhone = client.phone;
    const clientAddress = client.address;

    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        balance: totals.total,
        businessId: data.businessId,
        clientAddress,
        clientEmail,
        clientId: clientId,
        clientPhone,
        currency: data.currency,
        customHeader: data.customHeader,
        discount: data.discount,
        discountType: data.discountType,
        dueDate: data.dueDate,
        invoiceNumber,
        issueDate: data.issueDate,
        items: {
          create: itemsToCreate,
        },
        notes: data.notes,
        purchaseOrder: data.purchaseOrder,
        selectedPaymentMethodId: data.selectedPaymentMethodId ?? null,
        sequence,
        status: "DRAFT",
        subtotal: totals.subtotal,
        taxMode: data.taxMode,
        taxName: data.taxName ?? null,
        taxPercentage: data.taxPercentage ?? null,
        terms: data.terms,
        total: totals.total,
        totalTax: totals.totalTax,
        workspaceId,
      },
      include: {
        business: true,
        client: true,
        items: true,
      },
    });

    return {
      ...invoice,
      balance: Number(invoice.balance),
      business: {
        ...invoice.business,
        defaultTaxMode: invoice.business.defaultTaxMode,
        defaultTaxPercentage: invoice.business.defaultTaxPercentage
          ? Number(invoice.business.defaultTaxPercentage)
          : null,
      },
      discount: Number(invoice.discount),
      items: invoice.items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        total: Number(item.total),
        unitPrice: Number(item.unitPrice),
      })),
      sequence: invoice.sequence,
      subtotal: Number(invoice.subtotal),
      taxPercentage: invoice.taxPercentage
        ? Number(invoice.taxPercentage)
        : null,
      total: Number(invoice.total),
      totalTax: Number(invoice.totalTax),
    };
  });
}

// ===== CORE INVOICE OPERATIONS =====

/**
 * Delete an invoice
 */
export async function deleteInvoice(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findUnique({
      include: { payments: true },
      where: { id },
    });

    if (!existingInvoice || existingInvoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (existingInvoice.status !== "DRAFT") {
      throw new EntityValidationError("Cannot delete a non-draft invoice");
    }

    if (existingInvoice.payments.length > 0) {
      throw new EntityValidationError("Cannot delete an invoice with payments");
    }

    await tx.invoice.delete({
      where: { id },
    });
  });
}

/**
 * Delete an invoice item
 */
export async function deleteInvoiceItem(
  workspaceId: number,
  invoiceId: number,
  itemId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError(
        "Cannot delete item from a non-draft invoice",
      );
    }

    // Verify item exists
    const existingItem = await tx.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (existingItem?.invoiceId !== invoiceId) {
      throw new EntityNotFoundError("Invoice item not found");
    }

    // Delete item
    await tx.invoiceItem.delete({
      where: { id: itemId },
    });

    // Recalculate invoice totals
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
    });

    const totals = calculateInvoiceTotals(
      {
        discount: Number(invoice.discount),
        discountType: invoice.discountType,
        taxMode: invoice.taxMode,
        taxPercentage: invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : null,
      },
      allItems.map((i) => ({
        discount: Number(i.discount),
        discountType: i.discountType,
        quantity: Number(i.quantity),
        tax: Number(i.tax),
        unitPrice: Number(i.unitPrice),
        vatEnabled: i.vatEnabled,
      })),
    );

    await tx.invoice.update({
      data: {
        subtotal: totals.subtotal,
        total: totals.total,
        totalTax: totals.totalTax,
      },
      where: { id: invoiceId },
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);
  });
}

/**
 * Delete a payment (soft delete)
 */
export async function deletePayment(
  workspaceId: number,
  invoiceId: number,
  paymentId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // Verify payment exists
    const existingPayment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (existingPayment?.invoiceId !== invoiceId) {
      throw new EntityNotFoundError("Payment not found");
    }

    await tx.payment.delete({
      where: { id: paymentId },
    });

    // Update invoice balance and status
    await updateInvoiceBalanceAndStatus(tx, invoiceId, Number(invoice.total));
  });
}

/**
 * Get invoice by ID with items and relations (same shape as getInvoiceBySequence).
 * Used by the send-receipt queue worker to build the invoice PDF.
 */
export async function getInvoiceById(
  workspaceId: number,
  invoiceId: number,
): Promise<InvoiceEntityWithRelations> {
  const invoice = await prisma.invoice.findFirst({
    include: {
      business: true,
      client: true,
      items: { orderBy: { name: "asc" } },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      selectedPaymentMethod: true,
    },
    where: {
      id: invoiceId,
      workspaceId,
    },
  });

  if (!invoice) {
    throw new EntityNotFoundError("Invoice not found");
  }

  return {
    ...invoice,
    balance: Number(invoice.balance),
    business: {
      ...invoice.business,
      defaultTaxMode: invoice.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: invoice.business.defaultTaxPercentage
        ? Number(invoice.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(invoice.discount),
    items: invoice.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    selectedPaymentMethod: invoice.selectedPaymentMethod,
    subtotal: Number(invoice.subtotal),
    taxPercentage: invoice.taxPercentage ? Number(invoice.taxPercentage) : null,
    total: Number(invoice.total),
    totalTax: Number(invoice.totalTax),
  };
}

/**
 * Get invoice by ID with items and payments
 */
export async function getInvoiceBySequence(
  workspaceId: number,
  sequence: number,
): Promise<InvoiceEntityWithRelations> {
  const invoice = await prisma.invoice.findUnique({
    include: {
      business: true,
      client: true,
      items: {
        orderBy: { name: "asc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      selectedPaymentMethod: true,
    },
    where: {
      workspaceId_sequence: {
        sequence,
        workspaceId,
      },
    },
  });

  if (!invoice || invoice.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Invoice not found");
  }

  return {
    ...invoice,
    balance: Number(invoice.balance),
    business: {
      ...invoice.business,
      defaultTaxMode: invoice.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: invoice.business.defaultTaxPercentage
        ? Number(invoice.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(invoice.discount),
    items: invoice.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    selectedPaymentMethod: invoice.selectedPaymentMethod,
    subtotal: Number(invoice.subtotal),
    taxPercentage: invoice.taxPercentage ? Number(invoice.taxPercentage) : null,
    total: Number(invoice.total),
    totalTax: Number(invoice.totalTax),
  };
}

/**
 * Get next invoice number for a workspace (standalone version)
 * This version can be used without a transaction
 */
export async function getNextInvoiceNumberForWorkspace(
  workspaceId: number,
  businessId: number,
): Promise<string> {
  return await getNextInvoiceNumberInternal(prisma, businessId, workspaceId);
}

/**
 * List all invoices for a workspace
 */
export async function listInvoices(
  workspaceId: number,
  query: ListInvoicesQuery,
): Promise<{
  invoices: InvoiceEntityWithRelations[];
  limit: number;
  page: number;
  stats: {
    outstanding: number;
    paidCount: number;
    pendingCount: number;
    revenue: number;
    total: number;
    totalInvoiced: number;
  };
  total: number;
}> {
  const {
    businessId,
    clientId,
    limit,
    page,
    search,
    status: statusParam,
  } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {
    workspaceId,

    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { businessName: { contains: search, mode: "insensitive" } } },
      ],
    }),
    // Only allowed statuses (DRAFT, SENT, PAID, OVERDUE); VIEWED excluded from filter
    ...(statusParam && { status: statusParam }),
    ...(clientId && { clientId }),
    ...(businessId && { businessId }),
  };

  const wherePaid: Prisma.InvoiceWhereInput = { ...where, status: "PAID" };
  const whereOverdue: Prisma.InvoiceWhereInput = {
    ...where,
    status: "OVERDUE",
  };

  const [
    invoices,
    total,
    paidCount,
    pendingCount,
    revenueAgg,
    totalInvoicedAgg,
    outstandingAgg,
  ] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        business: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.count({ where: wherePaid }),
    prisma.invoice.count({ where: whereOverdue }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { invoice: where },
    }),
    prisma.invoice.aggregate({ _sum: { total: true }, where }),
    prisma.invoice.aggregate({ _sum: { balance: true }, where }),
  ]);

  return {
    invoices: invoices.map((inv) => {
      return {
        ...inv,
        balance: Number(inv.balance),
        business: {
          ...inv.business,
          defaultTaxMode: inv.business.defaultTaxMode,
          defaultTaxPercentage: inv.business.defaultTaxPercentage
            ? Number(inv.business.defaultTaxPercentage)
            : null,
        },
        discount: Number(inv.discount),
        subtotal: Number(inv.subtotal),
        taxPercentage: inv.taxPercentage ? Number(inv.taxPercentage) : null,
        total: Number(inv.total),
        totalTax: Number(inv.totalTax),
      };
    }),
    limit,
    page,
    stats: {
      outstanding: Number(outstandingAgg._sum.balance ?? 0),
      paidCount,
      pendingCount,
      revenue: Number(revenueAgg._sum.amount ?? 0),
      total,
      totalInvoiced: Number(totalInvoicedAgg._sum.total ?? 0),
    },
    total,
  };
}

/**
 * Mark an invoice as sent
 * Updates status to SENT and sets sentAt timestamp
 */
export async function markInvoiceAsSent(
  workspaceId: number,
  invoiceId: number,
): Promise<InvoiceEntityWithRelations> {
  const invoice = await prisma.invoice.findUnique({
    include: { _count: { select: { items: true } } },
    where: {
      id: invoiceId,
    },
  });

  if (!invoice || invoice.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Invoice not found");
  }

  if (invoice._count.items === 0) {
    throw new EntityValidationError("Cannot send an invoice with no items");
  }

  // Idempotent: if already sent (SENT, VIEWED, or PAID), don't overwrite status—return current state
  if (["PAID", "SENT", "VIEWED"].includes(invoice.status) && invoice.sentAt) {
    const existing = await prisma.invoice.findUnique({
      include: { business: true, client: true },
      where: { id: invoiceId },
    });
    if (!existing) throw new EntityNotFoundError("Invoice not found");
    return {
      ...existing,
      balance: Number(existing.balance),
      business: {
        ...existing.business,
        defaultTaxMode: existing.business.defaultTaxMode,
        defaultTaxPercentage: existing.business.defaultTaxPercentage
          ? Number(existing.business.defaultTaxPercentage)
          : null,
      },
      discount: Number(existing.discount),
      subtotal: Number(existing.subtotal),
      taxPercentage: existing.taxPercentage
        ? Number(existing.taxPercentage)
        : null,
      total: Number(existing.total),
      totalTax: Number(existing.totalTax),
    };
  }

  const updatedInvoice = await prisma.invoice.update({
    data: {
      sentAt: new Date(),
      status: "SENT",
    },
    include: {
      business: true,
      client: true,
    },

    where: {
      id: invoiceId,
    },
  });

  return {
    ...updatedInvoice,
    balance: Number(updatedInvoice.balance),
    business: {
      ...updatedInvoice.business,
      defaultTaxMode: updatedInvoice.business.defaultTaxMode,
      defaultTaxPercentage: updatedInvoice.business.defaultTaxPercentage
        ? Number(updatedInvoice.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(updatedInvoice.discount),
    subtotal: Number(updatedInvoice.subtotal),
    taxPercentage: updatedInvoice.taxPercentage
      ? Number(updatedInvoice.taxPercentage)
      : null,
    total: Number(updatedInvoice.total),
    totalTax: Number(updatedInvoice.totalTax),
  };
}

/**
 * Revert an invoice from SENT back to DRAFT (e.g. when send-invoice worker fails).
 * No-op if invoice is not SENT.
 */
export async function revertInvoiceToDraft(
  workspaceId: number,
  invoiceId: number,
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (invoice?.workspaceId !== workspaceId) {
    return;
  }

  if (invoice.status !== "SENT") {
    return;
  }

  await prisma.invoice.update({
    data: {
      sentAt: null,
      status: "DRAFT",
    },
    where: { id: invoiceId },
  });
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(
  workspaceId: number,
  id: number,
  data: UpdateInvoiceDto,
): Promise<InvoiceEntityWithRelations> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const existingInvoice = await tx.invoice.findUnique({
      where: { id },
    });

    if (existingInvoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (existingInvoice.status !== "DRAFT") {
      throw new EntityValidationError("Cannot update a sent invoice");
    }

    // If items are being updated, recalculate totals
    const {
      clientAddress,
      clientData: _clientData,
      clientEmail,
      clientId,
      clientPhone,
      createClient,
      items: _items,
      selectedPaymentMethodId,
      ...invoiceData
    } = data;
    const updateData: Prisma.InvoiceUpdateInput = { ...invoiceData };

    // Handle client creation or selection
    let newClientId: number | undefined;

    if (data.createClient === true && data.clientData) {
      // Create new client within the transaction
      // Get next client sequence
      const lastClient = await tx.client.findFirst({
        orderBy: {
          sequence: "desc",
        },
        select: {
          sequence: true,
        },
        where: {
          workspaceId,
        },
      });
      const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

      // Create the client
      const newClient = await tx.client.create({
        data: {
          address: data.clientData.address,
          businessName: data.clientData.businessName,
          email: data.clientData.email,
          name: data.clientData.name,
          nit: data.clientData.nit,
          phone: data.clientData.phone,
          reminderAfterDueIntervalDays:
            data.clientData.reminderAfterDueIntervalDays,
          reminderBeforeDueIntervalDays:
            data.clientData.reminderBeforeDueIntervalDays,
          sequence: clientSequence,
          workspaceId,
        },
      });

      newClientId = newClient.id;

      updateData.clientEmail = newClient.email;
      updateData.clientPhone = newClient.phone;
      updateData.clientAddress = newClient.address;
    }

    // Handle invoice-specific client fields
    // If clientId is being changed, fetch new client for defaults
    if (clientId && clientId !== existingInvoice.clientId && !createClient) {
      const newClient = await tx.client.findUnique({
        where: { id: clientId },
      });

      if (!newClient) {
        throw new EntityValidationError("Client not found");
      }

      // If invoice-specific fields not provided, use new client defaults
      if (clientEmail !== undefined) {
        updateData.clientEmail = clientEmail;
      } else {
        updateData.clientEmail = newClient.email;
      }

      if (clientPhone !== undefined) {
        updateData.clientPhone = clientPhone;
      } else {
        updateData.clientPhone = newClient.phone;
      }

      if (clientAddress !== undefined) {
        updateData.clientAddress = clientAddress;
      } else {
        updateData.clientAddress = newClient.address;
      }
    }

    if (!createClient) {
      // Client not changing, just update the fields if provided
      if (clientEmail !== undefined) {
        updateData.clientEmail = clientEmail;
      }
      if (clientPhone !== undefined) {
        updateData.clientPhone = clientPhone;
      }
      if (clientAddress !== undefined) {
        updateData.clientAddress = clientAddress;
      }
    }

    // Just update invoice fields, recalculate if tax/discount changed
    const taxModeChanged =
      data.taxMode !== undefined && data.taxMode !== existingInvoice.taxMode;
    const discountChanged =
      data.discount !== undefined || data.discountType !== undefined;
    const taxPercentageChanged = data.taxPercentage !== undefined;

    // If taxMode changed to NONE, clear tax data on all items
    if (taxModeChanged && data.taxMode === "NONE") {
      await tx.invoiceItem.updateMany({
        data: { tax: 0, vatEnabled: false },
        where: { invoiceId: id },
      });

      const invoiceItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });

      const itemsToUpdate = invoiceItems.map((item) => ({
        discount: Number(item.discount),
        discountType: item.discountType,
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        unitPrice: Number(item.unitPrice),
        vatEnabled: item.vatEnabled,
      }));

      // Recalculate totals with cleared tax data
      const totalsAfterClear = calculateInvoiceTotals(
        {
          discount: data.discount ?? Number(existingInvoice.discount),
          discountType: data.discountType ?? existingInvoice.discountType,
          taxMode: "NONE",
          taxPercentage: null,
        },
        itemsToUpdate,
      );
      updateData.subtotal = totalsAfterClear.subtotal;
      updateData.totalTax = totalsAfterClear.totalTax;
      updateData.total = totalsAfterClear.total;
    }

    // If taxMode changed to something other than BY_TOTAL, clear taxName and taxPercentage
    if (taxModeChanged && data.taxMode !== "BY_TOTAL") {
      updateData.taxName = null;
      updateData.taxPercentage = null;
    }

    // If taxMode changed to BY_TOTAL or taxPercentage changed in BY_TOTAL mode, update all items with vatEnabled
    const effectiveTaxMode = data.taxMode ?? existingInvoice.taxMode;
    const effectiveTaxPercentage =
      data.taxPercentage !== undefined
        ? data.taxPercentage
        : existingInvoice.taxPercentage
          ? Number(existingInvoice.taxPercentage)
          : null;
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      effectiveTaxPercentage !== null &&
      (taxModeChanged || taxPercentageChanged)
    ) {
      await tx.invoiceItem.updateMany({
        data: {
          tax: effectiveTaxPercentage,
          vatEnabled: effectiveTaxPercentage !== 0,
        },
        where: {
          invoiceId: id,
        },
      });
    }

    if (taxModeChanged || discountChanged || taxPercentageChanged) {
      const invoiceItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });

      const itemsToUpdate = invoiceItems.map((item) => ({
        discount: Number(item.discount),
        discountType: item.discountType,
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        unitPrice: Number(item.unitPrice),
        vatEnabled: item.vatEnabled,
      }));

      const totals = calculateInvoiceTotals(
        {
          discount: data.discount ?? Number(existingInvoice.discount),
          discountType: data.discountType ?? existingInvoice.discountType,
          taxMode: data.taxMode ?? existingInvoice.taxMode,
          taxPercentage:
            data.taxPercentage !== undefined
              ? data.taxPercentage
              : existingInvoice.taxPercentage
                ? Number(existingInvoice.taxPercentage)
                : null,
        },
        itemsToUpdate,
      );

      updateData.subtotal = totals.subtotal;
      updateData.totalTax = totals.totalTax;
      updateData.total = totals.total;
    }

    const updatedInvoice = await tx.invoice.update({
      data: {
        ...updateData,
        client: {
          connect:
            createClient && newClientId !== undefined
              ? { id: newClientId }
              : clientId
                ? { id: clientId }
                : undefined,
        },
        ...(selectedPaymentMethodId !== undefined && {
          selectedPaymentMethod:
            selectedPaymentMethodId != null
              ? { connect: { id: selectedPaymentMethodId } }
              : { disconnect: true },
        }),
      },
      include: {
        business: true,
        client: true,
        items: true,
        selectedPaymentMethod: true,
      },
      where: { id, workspaceId },
    });

    await updateInvoiceBalanceAndStatus(tx, id, Number(updatedInvoice.total));

    const withBalance = await tx.invoice.findUnique({
      select: { balance: true },
      where: { id, workspaceId },
    });

    return {
      ...updatedInvoice,
      balance: Number(withBalance?.balance ?? updatedInvoice.balance),
      business: {
        ...updatedInvoice.business,
        defaultTaxMode: updatedInvoice.business.defaultTaxMode,
        defaultTaxPercentage: updatedInvoice.business.defaultTaxPercentage
          ? Number(updatedInvoice.business.defaultTaxPercentage)
          : null,
      },
      discount: Number(updatedInvoice.discount),
      items: updatedInvoice.items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        total: Number(item.total),
        unitPrice: Number(item.unitPrice),
      })),
      selectedPaymentMethod: updatedInvoice.selectedPaymentMethod ?? undefined,
      subtotal: Number(updatedInvoice.subtotal),
      taxPercentage: updatedInvoice.taxPercentage
        ? Number(updatedInvoice.taxPercentage)
        : null,
      total: Number(updatedInvoice.total),
      totalTax: Number(updatedInvoice.totalTax),
    };
  });
}

/**
 * Update an invoice item
 */
export async function updateInvoiceItem(
  workspaceId: number,
  invoiceId: number,
  itemId: number,
  data: UpdateInvoiceItemDto,
): Promise<InvoiceItemEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError(
        "Cannot update item of a non-draft invoice",
      );
    }

    // Verify item exists
    const existingItem = await tx.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (existingItem?.invoiceId !== invoiceId) {
      throw new EntityNotFoundError("Invoice item not found");
    }

    // Handle catalog integration if needed
    let itemCatalogId = existingItem.catalogId;

    // If catalogId is provided directly, use it (when updating from existing catalog)
    if (data.catalogId !== undefined) {
      if (data.catalogId === null) {
        // Explicitly remove catalog link
        itemCatalogId = null;
      } else {
        // Verify catalog exists and belongs to the invoice's business
        const catalog = await tx.catalog.findUnique({
          where: { id: data.catalogId },
        });

        if (!catalog) {
          throw new EntityNotFoundError("Catalog item not found");
        }

        if (catalog.businessId !== invoice.businessId) {
          throw new EntityValidationError(
            "Catalog item does not belong to the invoice's business",
          );
        }

        itemCatalogId = data.catalogId;
      }
    } else if (data.saveToCatalog && !itemCatalogId) {
      // Create new catalog entry or link to existing one by name
      itemCatalogId = await handleCatalogIntegration(
        tx,
        workspaceId,
        invoice.businessId,
        {
          description: data.description ?? existingItem.description,
          name: data.name ?? existingItem.name,
          price: data.unitPrice ?? Number(existingItem.unitPrice),
          quantityUnit: data.quantityUnit ?? existingItem.quantityUnit,
        },
      );
    }

    // Prepare update data - exclude saveToCatalog, taxMode, taxName, taxPercentage, and catalogId as they're not item database fields
    const {
      catalogId: _catalogId,
      saveToCatalog: _saveToCatalog,
      taxMode: passedTaxMode,
      taxName: passedTaxName,
      taxPercentage: passedTaxPercentage,
      ...itemData
    } = data;
    const updateData: Prisma.InvoiceItemUpdateInput = {};

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = passedTaxMode ?? invoice.taxMode;

    // Prepare invoice update data for tax-related fields
    const invoiceUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
    } = {};

    // If taxMode was passed and differs from invoice, update the invoice
    if (passedTaxMode && passedTaxMode !== invoice.taxMode) {
      invoiceUpdateData.taxMode = passedTaxMode;
    }

    // If taxMode is BY_TOTAL and taxName/taxPercentage are provided, update them
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (passedTaxName !== undefined || passedTaxPercentage !== undefined)
    ) {
      if (passedTaxName !== undefined) {
        invoiceUpdateData.taxName = passedTaxName;
      }
      if (passedTaxPercentage !== undefined) {
        invoiceUpdateData.taxPercentage = passedTaxPercentage;
      }
    }

    // Update invoice if there are tax-related changes (before calculating totals)
    if (Object.keys(invoiceUpdateData).length > 0) {
      await tx.invoice.update({
        data: invoiceUpdateData,
        where: { id: invoiceId },
      });
    }

    // Only include fields that are provided in the update
    if (itemData.name !== undefined) updateData.name = itemData.name;
    if (itemData.description !== undefined)
      updateData.description = itemData.description;
    if (itemData.quantity !== undefined)
      updateData.quantity = itemData.quantity;
    if (itemData.quantityUnit !== undefined)
      updateData.quantityUnit = itemData.quantityUnit;
    if (itemData.unitPrice !== undefined)
      updateData.unitPrice = itemData.unitPrice;
    if (itemData.discount !== undefined)
      updateData.discount = itemData.discount;
    if (itemData.discountType !== undefined)
      updateData.discountType = itemData.discountType;

    // Respect effective taxMode when setting tax fields
    if (effectiveTaxMode === "BY_PRODUCT") {
      // Use tax field, ignore vatEnabled
      if (itemData.tax !== undefined) updateData.tax = itemData.tax;
      updateData.vatEnabled = false; // Always set to false for BY_PRODUCT
    } else if (effectiveTaxMode === "BY_TOTAL") {
      // Use vatEnabled field, set tax to invoice taxPercentage for display if vatEnabled
      const shouldHaveTax =
        (itemData.vatEnabled ?? existingItem.vatEnabled) &&
        invoice.taxPercentage;
      updateData.tax = shouldHaveTax ? Number(invoice.taxPercentage) : 0;
      if (itemData.vatEnabled !== undefined)
        updateData.vatEnabled = itemData.vatEnabled;
    } else {
      // taxMode is NONE - both should be defaults
      updateData.tax = 0;
      updateData.vatEnabled = false;
    }

    if (itemCatalogId !== null) {
      updateData.catalog = { connect: { id: itemCatalogId } };
    } else if (
      (data.catalogId === null || data.saveToCatalog === false) &&
      existingItem.catalogId !== null
    ) {
      // If explicitly set to null/false and item has a catalog, disconnect it
      updateData.catalog = { disconnect: true };
    }

    // Calculate new item total - respect effective taxMode
    let finalTax = 0;
    let finalVatEnabled = false;
    if (effectiveTaxMode === "BY_PRODUCT") {
      finalTax = data.tax ?? Number(existingItem.tax);
      finalVatEnabled = false;
    } else if (effectiveTaxMode === "BY_TOTAL") {
      finalVatEnabled = data.vatEnabled ?? existingItem.vatEnabled;
      // Set tax to invoice taxPercentage for display if vatEnabled
      finalTax =
        finalVatEnabled && invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : 0;
    } else {
      // taxMode is NONE
      finalTax = 0;
      finalVatEnabled = false;
    }

    const finalItem = {
      discount: data.discount ?? Number(existingItem.discount),
      discountType: data.discountType ?? existingItem.discountType,
      quantity: data.quantity ?? Number(existingItem.quantity),
      tax: finalTax,
      unitPrice: data.unitPrice ?? Number(existingItem.unitPrice),
      vatEnabled: finalVatEnabled,
    };

    // Use updated taxPercentage if provided, otherwise use invoice's current value
    const effectiveTaxPercentage =
      passedTaxPercentage !== undefined
        ? passedTaxPercentage
        : invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : null;

    const itemTotal = calculateItemTotal(finalItem);

    updateData.total = itemTotal;

    // Update item
    const item = await tx.invoiceItem.update({
      data: updateData,
      where: { id: itemId },
    });

    // Recalculate invoice totals
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
    });

    const totals = calculateInvoiceTotals(
      {
        discount: Number(invoice.discount),
        discountType: invoice.discountType,
        taxMode: effectiveTaxMode,
        taxPercentage: effectiveTaxPercentage,
      },
      allItems.map((i) => ({
        discount: Number(i.discount),
        discountType: i.discountType,
        quantity: Number(i.quantity),
        tax: Number(i.tax),
        unitPrice: Number(i.unitPrice),
        vatEnabled: i.vatEnabled,
      })),
    );

    // Prepare final invoice update data
    const finalInvoiceUpdateData: {
      subtotal: number;
      taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
      total: number;
      totalTax: number;
    } = {
      subtotal: totals.subtotal,
      taxMode: effectiveTaxMode, // Update invoice taxMode if it changed
      total: totals.total,
      totalTax: totals.totalTax,
    };

    // Include taxName and taxPercentage if they were provided and taxMode is BY_TOTAL
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (passedTaxName !== undefined || passedTaxPercentage !== undefined)
    ) {
      if (passedTaxName !== undefined) {
        finalInvoiceUpdateData.taxName = passedTaxName;
      }
      if (passedTaxPercentage !== undefined) {
        finalInvoiceUpdateData.taxPercentage = passedTaxPercentage;
      }
    }

    await tx.invoice.update({
      data: finalInvoiceUpdateData,
      where: { id: invoiceId },
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);

    return {
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    };
  });
}

// ===== INVOICE ITEM OPERATIONS =====

/**
 * Update a payment
 */
export async function updatePayment(
  workspaceId: number,
  invoiceId: number,
  paymentId: number,
  data: UpdatePaymentDto,
): Promise<PaymentEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // Verify payment exists
    const existingPayment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (existingPayment?.invoiceId !== invoiceId) {
      throw new EntityNotFoundError("Payment not found");
    }

    // Update payment
    const updateData: Prisma.PaymentUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentMethod !== undefined)
      updateData.paymentMethod = data.paymentMethod;
    if (data.transactionId !== undefined)
      updateData.transactionId = data.transactionId;
    if (data.details !== undefined) updateData.details = data.details;
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt;

    const payment = await tx.payment.update({
      data: updateData,
      where: { id: paymentId },
    });

    // Update invoice balance and status
    await updateInvoiceBalanceAndStatus(tx, invoiceId, Number(invoice.total));

    return {
      ...payment,
      amount: Number(payment.amount),
    } as PaymentEntity;
  });
}

/**
 * Calculate invoice totals from items
 */
function calculateInvoiceTotals(
  invoice: {
    discount: number;
    discountType: "FIXED" | "NONE" | "PERCENTAGE";
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxPercentage: null | number;
  },
  items: {
    discount: number;
    discountType: "FIXED" | "NONE" | "PERCENTAGE";
    quantity: number;
    tax: number;
    unitPrice: number;
    vatEnabled: boolean;
  }[],
): {
  subtotal: number;
  total: number;
  totalTax: number;
} {
  // Calculate each item's total (after item discount, before tax)
  const itemTotals = items.map((item) => {
    const baseAmount = item.quantity * item.unitPrice;
    let itemTotalAfterDiscount = baseAmount;
    if (item.discountType === "PERCENTAGE") {
      itemTotalAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
    } else if (item.discountType === "FIXED") {
      itemTotalAfterDiscount = baseAmount - item.discount;
    }
    return itemTotalAfterDiscount;
  });

  // Subtotal: sum of all item totals (after item discounts)
  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

  // Apply invoice-level discount to subtotal (tax must be calculated after all discounts)
  let subtotalAfterDiscount = subtotal;
  if (invoice.discountType === "PERCENTAGE") {
    subtotalAfterDiscount = subtotal - (subtotal * invoice.discount) / 100;
  } else if (invoice.discountType === "FIXED") {
    subtotalAfterDiscount = subtotal - invoice.discount;
  }

  // Tax base = amount after all discounts; apply proportional discount ratio to taxable amounts
  let totalTax: number;
  if (subtotal === 0) {
    totalTax = 0;
  } else {
    const ratio = subtotalAfterDiscount / subtotal;
    if (invoice.taxMode === "BY_PRODUCT") {
      totalTax = items.reduce((sum, item, index) => {
        const itemTaxableAfterDiscount = (itemTotals[index] ?? 0) * ratio;
        return sum + (itemTaxableAfterDiscount * item.tax) / 100;
      }, 0);
    } else if (invoice.taxMode === "BY_TOTAL" && invoice.taxPercentage) {
      const taxableSubtotal = items.reduce(
        (sum, item, index) =>
          item.vatEnabled ? sum + (itemTotals[index] ?? 0) : sum,
        0,
      );
      const taxableAfterDiscount = taxableSubtotal * ratio;
      totalTax = (taxableAfterDiscount * invoice.taxPercentage) / 100;
    } else {
      totalTax = 0;
    }
  }

  // Total: subtotal after discount + total tax
  const total = subtotalAfterDiscount + totalTax;

  return {
    subtotal,
    total,
    totalTax,
  };
}

/**
 * Extract numeric part from invoice number using regex
 * Returns the last sequence of digits found in the string
 */
function extractNumberFromInvoiceNumber(invoiceNumber: string): null | number {
  const matches = invoiceNumber.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  const last = matches.at(-1);
  return last ? parseInt(last, 10) : null;
}

// ===== PAYMENT OPERATIONS =====

/**
 * Get next invoice number for a workspace
 * This version works with a transaction client (for use within transactions)
 */
async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  businessId: number,
  workspaceId: number,
): Promise<string> {
  return await getNextInvoiceNumberInternal(tx, businessId, workspaceId);
}

/**
 * Internal implementation of getNextInvoiceNumber
 * Works with both Prisma client and transaction client
 */
async function getNextInvoiceNumberInternal(
  client: Prisma.TransactionClient | typeof prisma,
  businessId: number,
  workspaceId: number,
): Promise<string> {
  // Get workspace to get invoice prefix
  const workspace = await client.workspace.findUnique({
    select: { invoiceNumberPrefix: true },
    where: { id: workspaceId },
  });

  const prefix = workspace?.invoiceNumberPrefix ?? null;

  // If there's a prefix configured, find the last invoice that starts with that prefix
  if (prefix) {
    const lastInvoiceWithPrefix = await client.invoice.findFirst({
      orderBy: {
        invoiceNumber: "desc",
      },
      select: {
        invoiceNumber: true,
      },
      where: {
        businessId,
        invoiceNumber: {
          startsWith: prefix,
        },

        workspaceId,
      },
    });

    if (!lastInvoiceWithPrefix) {
      // No invoices with this prefix yet, start from 1
      return `${prefix}0001`;
    }

    // Extract number from last invoice number
    const extractedNumber = extractNumberFromInvoiceNumber(
      lastInvoiceWithPrefix.invoiceNumber,
    );

    if (extractedNumber !== null && !isNaN(extractedNumber)) {
      const nextNumber = extractedNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(4, "0");
      return `${prefix}${paddedNumber}`;
    } else {
      // Couldn't extract number, append 0001
      return `${prefix}0001`;
    }
  } else {
    // No prefix configured, find the last invoice and try to increment
    const lastInvoice = await client.invoice.findFirst({
      orderBy: {
        invoiceNumber: "desc",
      },
      select: {
        invoiceNumber: true,
      },
      where: {
        businessId,
        workspaceId,
      },
    });

    if (!lastInvoice) {
      // No invoices at all, use default
      return "INV-0001";
    }

    // Try to extract and increment the number from the last invoice
    const extractedNumber = extractNumberFromInvoiceNumber(
      lastInvoice.invoiceNumber,
    );

    if (extractedNumber !== null && !isNaN(extractedNumber)) {
      const nextNumber = extractedNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(4, "0");
      // Try to preserve the format by keeping the prefix part if it exists
      const prefixMatch = /^[^0-9]*/.exec(lastInvoice.invoiceNumber);
      const preservedPrefix = prefixMatch ? prefixMatch[0] : "INV-";
      return `${preservedPrefix}${paddedNumber}`;
    } else {
      // Couldn't extract number, use default
      return "INV-0001";
    }
  }
}

/**
 * Handle catalog integration for invoice item
 */
async function handleCatalogIntegration(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  businessId: number,
  itemData: {
    description: string;
    name: string;
    price: number;
    quantityUnit: "DAYS" | "HOURS" | "UNITS";
  },
): Promise<null | number> {
  // Check if catalog item with same name exists for this business
  const existingCatalog = await tx.catalog.findFirst({
    select: {
      id: true,
    },
    where: {
      businessId,
      name: itemData.name,
      workspaceId,
    },
  });

  if (existingCatalog) {
    // Link to existing catalog
    return existingCatalog.id;
  }

  // Create new catalog entry
  // First, get next sequence for this business
  const lastCatalog = await tx.catalog.findFirst({
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
    where: {
      workspaceId,
    },
  });

  const sequence = lastCatalog ? lastCatalog.sequence + 1 : 1;

  const newCatalog = await tx.catalog.create({
    data: {
      businessId,
      description: itemData.description,
      name: itemData.name,
      price: itemData.price,
      quantityUnit: itemData.quantityUnit,
      sequence,
      workspaceId,
    },
  });

  return newCatalog.id;
}

/**
 * Helper function to update invoice balance and status based on payments
 * This function calculates the total of all non-deleted payments and updates
 * the invoice balance and status accordingly.
 */
async function updateInvoiceBalanceAndStatus(
  tx: Prisma.TransactionClient,
  invoiceId: number,
  invoiceTotal: number,
): Promise<void> {
  // Get all non-deleted payments for this invoice
  const payments = await tx.payment.findMany({
    select: {
      amount: true,
    },
    where: {
      invoiceId,
    },
  });

  // Calculate total payments
  const totalPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  // Calculate balance
  const balance = invoiceTotal - totalPayments;

  // Get current invoice to check status
  const invoice = await tx.invoice.findUnique({
    select: {
      paidAt: true,
      status: true,
      viewedAt: true,
    },
    where: { id: invoiceId },
  });

  if (!invoice) {
    return; // Should not happen, but guard against it
  }

  // Prepare update data
  const updateData: Prisma.InvoiceUpdateInput = {
    balance,
  };

  // Update status based on balance
  // Only mark as PAID when there was an amount to pay (invoiceTotal > 0) and it's fully covered.
  // When total is 0 (e.g. all items deleted), balance is 0 but we must not set PAID.
  if (balance <= 0 && invoiceTotal > 0) {
    // Invoice is fully paid
    updateData.status = "PAID";
    if (!invoice.paidAt) {
      updateData.paidAt = new Date();
    }
  } else {
    // Invoice has remaining balance
    if (invoice.status === "PAID") {
      // Revert from PAID status
      // Prefer VIEWED if viewedAt exists, otherwise SENT
      if (invoice.viewedAt) {
        updateData.status = "VIEWED";
      } else {
        updateData.status = "SENT";
      }
      // Clear paidAt since it's no longer fully paid
      updateData.paidAt = null;
    }
    // If status is not PAID, leave it as is (could be DRAFT, SENT, VIEWED, OVERDUE)
  }

  // Update invoice
  await tx.invoice.update({
    data: updateData,
    where: { id: invoiceId },
  });
}
