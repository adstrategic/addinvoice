import {
  BusinessEntity,
  businessEntitySchema,
} from "./../businesses/businesses.schemas";
import prisma from "../../core/db";
import type { Prisma } from "../../generated/prisma/client";
import type {
  ListInvoicesQuery,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceEntityWithRelations,
  CreateInvoiceItemDto,
  UpdateInvoiceItemDto,
  InvoiceItemEntity,
} from "./invoices.schemas";
import {
  PaymentEntity,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "../payments/payments.schemas";
import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors";
import { ClientEntity } from "../clients/clients.schemas";

// ===== HELPER FUNCTIONS =====

/**
 * Calculate item total with discount and tax
 */
export function calculateItemTotal(
  item: {
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: "PERCENTAGE" | "FIXED" | "NONE";
    tax: number;
    vatEnabled: boolean;
  },
  invoiceTaxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE",
  invoiceTaxPercentage: number | null,
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

  // 3. Apply tax
  let taxAmount = 0;
  if (invoiceTaxMode === "BY_PRODUCT") {
    // Use item's tax percentage on item total after discount
    taxAmount = (itemTotalAfterDiscount * item.tax) / 100;
  } else if (
    invoiceTaxMode === "BY_TOTAL" &&
    item.vatEnabled &&
    invoiceTaxPercentage
  ) {
    // Use invoice tax percentage on items with vatEnabled = true
    taxAmount = (itemTotalAfterDiscount * invoiceTaxPercentage) / 100;
  }

  // 4. Final item total without tax so the tax is not added in the item but on the invoice level
  return itemTotalAfterDiscount;
}

/**
 * Calculate invoice totals from items
 */
function calculateInvoiceTotals(
  invoice: {
    discount: number;
    discountType: "PERCENTAGE" | "FIXED" | "NONE";
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxPercentage: number | null;
  },
  items: Array<{
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: "PERCENTAGE" | "FIXED" | "NONE";
    tax: number;
    vatEnabled: boolean;
  }>,
): {
  subtotal: number;
  totalTax: number;
  total: number;
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

  // Calculate tax for each item
  const itemTaxes = items.map((item, index) => {
    const itemTotalAfterDiscount = itemTotals[index];
    if (invoice.taxMode === "BY_PRODUCT") {
      return (itemTotalAfterDiscount * item.tax) / 100;
    } else if (
      invoice.taxMode === "BY_TOTAL" &&
      item.vatEnabled &&
      invoice.taxPercentage
    ) {
      return (itemTotalAfterDiscount * invoice.taxPercentage) / 100;
    }
    return 0;
  });

  // Total tax: sum of all item taxes
  const totalTax = itemTaxes.reduce((sum, tax) => sum + tax, 0);

  // Apply invoice-level discount to subtotal
  let subtotalAfterDiscount = subtotal;
  if (invoice.discountType === "PERCENTAGE") {
    subtotalAfterDiscount = subtotal - (subtotal * invoice.discount) / 100;
  } else if (invoice.discountType === "FIXED") {
    subtotalAfterDiscount = subtotal - invoice.discount;
  }

  // Total: subtotal after discount + total tax
  const total = subtotalAfterDiscount + totalTax;

  return {
    subtotal,
    totalTax,
    total,
  };
}

/**
 * Extract numeric part from invoice number using regex
 * Returns the last sequence of digits found in the string
 */
function extractNumberFromInvoiceNumber(invoiceNumber: string): number | null {
  // Find all sequences of digits in the invoice number
  const matches = invoiceNumber.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  // Return the last sequence of digits (most likely the sequence number)
  return parseInt(matches[matches.length - 1], 10);
}

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
    where: { id: workspaceId },
    select: { invoiceNumberPrefix: true },
  });

  const prefix = workspace?.invoiceNumberPrefix || null;

  // If there's a prefix configured, find the last invoice that starts with that prefix
  if (prefix) {
    const lastInvoiceWithPrefix = await client.invoice.findFirst({
      where: {
        workspaceId,
        businessId,

        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
      select: {
        invoiceNumber: true,
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
      where: {
        workspaceId,
        businessId,
      },
      orderBy: {
        invoiceNumber: "desc",
      },
      select: {
        invoiceNumber: true,
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
      const prefixMatch = lastInvoice.invoiceNumber.match(/^[^0-9]*/);
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
    name: string;
    description: string;
    price: number;
    quantityUnit: "DAYS" | "HOURS" | "UNITS";
  },
): Promise<number | null> {
  // Check if catalog item with same name exists for this business
  const existingCatalog = await tx.catalog.findFirst({
    where: {
      workspaceId,
      businessId,
      name: itemData.name,
    },
    select: {
      id: true,
    },
  });

  if (existingCatalog) {
    // Link to existing catalog
    return existingCatalog.id;
  }

  // Create new catalog entry
  // First, get next sequence for this business
  const lastCatalog = await tx.catalog.findFirst({
    where: {
      workspaceId,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  const sequence = lastCatalog ? lastCatalog.sequence + 1 : 1;

  const newCatalog = await tx.catalog.create({
    data: {
      workspaceId,
      businessId,
      name: itemData.name,
      description: itemData.description,
      price: itemData.price,
      quantityUnit: itemData.quantityUnit,
      sequence,
    },
  });

  return newCatalog.id;
}

// ===== CORE INVOICE OPERATIONS =====

/**
 * List all invoices for a workspace
 */
export async function listInvoices(
  workspaceId: number,
  query: ListInvoicesQuery,
): Promise<{
  invoices: InvoiceEntityWithRelations[];
  total: number;
  stats: {
    total: number;
    paidCount: number;
    pendingCount: number;
    revenue: number;
    totalInvoiced: number;
    outstanding: number;
  };
  page: number;
  limit: number;
}> {
  const {
    page,
    limit,
    search,
    status: statusParam,
    clientId,
    businessId,
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
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        business: true,
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.count({ where: wherePaid }),
    prisma.invoice.count({ where: whereOverdue }),
    prisma.payment.aggregate({
      where: { invoice: where },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({ where, _sum: { total: true } }),
    prisma.invoice.aggregate({ where, _sum: { balance: true } }),
  ]);

  return {
    invoices: invoices.map((inv) => {
      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        totalTax: Number(inv.totalTax),
        discount: Number(inv.discount),
        taxPercentage: inv.taxPercentage ? Number(inv.taxPercentage) : null,
        total: Number(inv.total),
        balance: Number(inv.balance),
        business: {
          ...inv.business,
          defaultTaxPercentage: inv.business.defaultTaxPercentage
            ? Number(inv.business.defaultTaxPercentage)
            : null,
          defaultTaxMode: inv.business.defaultTaxMode,
        },
      };
    }),
    total,
    stats: {
      total,
      paidCount,
      pendingCount,
      revenue: Number(revenueAgg._sum?.amount ?? 0),
      totalInvoiced: Number(totalInvoicedAgg._sum?.total ?? 0),
      outstanding: Number(outstandingAgg._sum?.balance ?? 0),
    },
    page,
    limit,
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
    where: {
      workspaceId_sequence: {
        workspaceId,
        sequence,
      },
    },
    include: {
      business: true,
      items: {
        orderBy: { name: "asc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      client: true,
      selectedPaymentMethod: true,
    },
  });

  if (!invoice || invoice.workspaceId !== workspaceId) {
    throw new EntityNotFoundError({
      message: "Invoice not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    totalTax: Number(invoice.totalTax),
    discount: Number(invoice.discount),
    taxPercentage: invoice.taxPercentage ? Number(invoice.taxPercentage) : null,
    total: Number(invoice.total),
    balance: Number(invoice.balance),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      total: Number(item.total),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    business: {
      ...invoice.business,
      defaultTaxPercentage: invoice.business.defaultTaxPercentage
        ? Number(invoice.business.defaultTaxPercentage)
        : null,
      defaultTaxMode: invoice.business.defaultTaxMode as
        | "NONE"
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | null
        | undefined,
    },
    selectedPaymentMethod: invoice.selectedPaymentMethod,
  };
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
    where: {
      id: invoiceId,
      workspaceId,
    },
    include: {
      business: true,
      items: { orderBy: { name: "asc" } },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      client: true,
      selectedPaymentMethod: true,
    },
  });

  if (!invoice) {
    throw new EntityNotFoundError({
      message: "Invoice not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    totalTax: Number(invoice.totalTax),
    discount: Number(invoice.discount),
    taxPercentage: invoice.taxPercentage ? Number(invoice.taxPercentage) : null,
    total: Number(invoice.total),
    balance: Number(invoice.balance),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      total: Number(item.total),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
    business: {
      ...invoice.business,
      defaultTaxPercentage: invoice.business.defaultTaxPercentage
        ? Number(invoice.business.defaultTaxPercentage)
        : null,
      defaultTaxMode: invoice.business.defaultTaxMode as
        | "NONE"
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | null
        | undefined,
    },
    selectedPaymentMethod: invoice.selectedPaymentMethod,
  };
}

/**
 * Build the payload expected by the PDF service for invoice generation.
 * Used by the controller (getInvoicePdf) and by the send-invoice queue worker.
 */
export function buildInvoicePdfPayload(invoice: InvoiceEntityWithRelations): {
  invoice: Omit<InvoiceEntityWithRelations, "issueDate" | "dueDate"> & {
    issueDate: string;
    dueDate: string;
    totalPaid?: number;
  };
  client: ClientEntity;
  company: BusinessEntity;
  items: InvoiceItemEntity[];
  paymentMethod: { type: string; handle: string | null } | null;
} {
  const invoiceDiscountFixed =
    invoice.discountType === "PERCENTAGE"
      ? (Number(invoice.subtotal) * Number(invoice.discount)) / 100
      : invoice.discountType === "FIXED"
        ? Number(invoice.discount)
        : 0;

  return {
    invoice: {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber,
      issueDate:
        typeof invoice.issueDate === "string"
          ? invoice.issueDate
          : invoice.issueDate.toISOString(),
      dueDate:
        typeof invoice.dueDate === "string"
          ? invoice.dueDate
          : invoice.dueDate.toISOString(),
      purchaseOrder: invoice.purchaseOrder,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      discount: invoiceDiscountFixed,
      totalTax: invoice.totalTax,
      total: invoice.total,
      totalPaid: (invoice.payments ?? []).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      ),
      balance: Number(invoice.balance ?? 0),
      notes: invoice.notes,
      terms: invoice.terms,
    },
    client: {
      ...invoice.client,
      name: invoice.client!.name,
      businessName: invoice.client!.businessName ?? null,
      address: invoice.client!.address ?? null,
      phone: invoice.client!.phone ?? null,
      email: invoice.client!.email ?? null,
      nit: invoice.client!.nit ?? null,
    },
    company: {
      ...invoice.business,
      name: invoice.business.name,
      address: invoice.business.address ?? null,
      email: invoice.business.email ?? null,
      phone: invoice.business.phone ?? null,
      nit: invoice.business.nit ?? null,
      logo: invoice.business.logo ?? null,
    },
    items: (invoice.items || []).map((item) => {
      const qty = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const discount = Number(item.discount ?? 0);
      const base = qty * unitPrice;
      const discountAmount =
        item.discountType === "PERCENTAGE"
          ? (base * discount) / 100
          : item.discountType === "FIXED"
            ? discount
            : 0;
      return {
        ...item,
        name: item.name,
        description: item.description ?? null,
        quantity: qty,
        quantityUnit: item.quantityUnit,
        unitPrice,
        tax: Number(item.tax ?? 0),
        discountAmount,
        total: Number(item.total ?? 0),
      };
    }),
    paymentMethod:
      invoice.selectedPaymentMethod &&
      invoice.selectedPaymentMethod.isEnabled &&
      invoice.selectedPaymentMethod.handle?.trim()
        ? {
            type: invoice.selectedPaymentMethod.type,
            handle: invoice.selectedPaymentMethod.handle.trim(),
          }
        : null,
  };
}

/**
 * Payload for the pdf-service POST /generate-receipt endpoint.
 * Shape must match pdf-service receiptPdfPayloadSchema.
 */
export interface ReceiptPdfPayload {
  company: { name: string; logo: string | null; address: string | null };
  client: { name: string; email: string | null };
  invoice: {
    invoiceNumber: string;
    total: number;
    currency: string;
    status: string;
    totalPaid: number;
    balance: number;
  };
  payment: {
    id: string;
    amount: number;
    method: string;
    date: string;
    notes: string | null;
  };
  payments: Array<{ date: string; method: string; amount: number }>;
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
    (sum, p) => sum + Number(p.amount),
    0,
  );
  const balance = Number(invoice.balance);
  const formatDate = (d: Date | string | undefined) =>
    d ? new Date(d).toLocaleDateString() : "";

  return {
    company: {
      name: invoice.business.name,
      logo: invoice.business.logo ?? null,
      address: invoice.business.address ?? null,
    },
    client: {
      name: invoice.client!.name,
      email: invoice.clientEmail ?? invoice.client!.email ?? null,
    },
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      total: Number(invoice.total),
      currency: invoice.currency,
      status: invoice.status,
      totalPaid,
      balance,
    },
    payment: {
      id: String(payment.id),
      amount: Number(payment.amount),
      method: payment.paymentMethod,
      date: formatDate(payment.paidAt),
      notes: payment.details ?? null,
    },
    payments: (invoice.payments ?? [])
      .slice()
      .sort((a, b) => {
        const pa = (a as { paidAt?: Date }).paidAt;
        const pb = (b as { paidAt?: Date }).paidAt;
        return (
          (pb ? new Date(pb).getTime() : 0) - (pa ? new Date(pa).getTime() : 0)
        );
      })
      .map((p) => ({
        date: formatDate((p as { paidAt?: Date }).paidAt),
        method: (p as { paymentMethod: string }).paymentMethod,
        amount: Number(p.amount),
      })),
  };
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
      throw new EntityValidationError({
        message:
          "You must create a business before creating invoices. Please complete the setup first.",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    const business = await tx.business.findFirst({
      where: {
        id: data.businessId,
        workspaceId,
      },
    });

    if (!business) {
      throw new EntityValidationError({
        message: "Business not found or does not belong to your workspace",
        statusCode: 400,
        code: "ERR_VALID",
      });
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
            workspaceId,
            businessId: data.businessId,
            invoiceNumber,
          },
        },
      });
      if (existing) {
        throw new EntityValidationError({
          message: "Invoice number already exists",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }
    }

    // Create invoice items with calculations
    const itemsToCreate = data.items
      ? await Promise.all(
          data.items.map(async (item) => {
            // Handle catalog integration if needed
            let catalogId: number | null = null;

            // If catalogId is provided directly, use it (when adding from existing catalog)
            if (item.catalogId) {
              // Verify catalog exists and belongs to the business
              const catalog = await tx.catalog.findUnique({
                where: { id: item.catalogId },
              });

              if (!catalog) {
                throw new EntityNotFoundError({
                  message: "Catalog item not found",
                  statusCode: 404,
                  code: "ERR_NF",
                });
              }

              if (catalog.businessId !== data.businessId) {
                throw new EntityValidationError({
                  message:
                    "Catalog item does not belong to the selected business",
                  statusCode: 400,
                  code: "ERR_VALID",
                });
              }

              catalogId = item.catalogId;
            } else if (item.saveToCatalog) {
              // Create new catalog entry or link to existing one by name
              catalogId = await handleCatalogIntegration(
                tx,
                workspaceId,
                data.businessId,
                {
                  name: item.name,
                  description: item.description,
                  price: item.unitPrice,
                  quantityUnit: item.quantityUnit,
                },
              );
            }

            // Determine item tax value based on taxMode
            let itemTax = 0;
            const itemVatEnabled = item.vatEnabled || false;
            if (data.taxMode === "BY_PRODUCT") {
              itemTax = item.tax || 0;
            } else if (data.taxMode === "BY_TOTAL") {
              // For BY_TOTAL mode, set tax to invoice taxPercentage for display if vatEnabled
              itemTax =
                itemVatEnabled && data.taxPercentage ? data.taxPercentage : 0;
            }

            // Calculate item total
            const itemTotal = calculateItemTotal(
              {
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                discountType: item.discountType,
                tax: itemTax,
                vatEnabled: itemVatEnabled,
              },
              data.taxMode,
              data.taxPercentage || null,
            );

            return {
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              quantityUnit: item.quantityUnit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              discountType: item.discountType,
              tax: itemTax,
              vatEnabled: itemVatEnabled,
              total: itemTotal,
              catalogId,
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
        taxPercentage: data.taxPercentage || null,
      },
      itemsToCreate,
    );

    // Get next sequence
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        workspaceId,
      },
      orderBy: {
        sequence: "desc",
      },
    });
    const sequence = lastInvoice ? lastInvoice.sequence + 1 : 1;

    // Handle client creation or selection
    let clientId: number;
    let client: {
      id: number;
      email: string;
      phone: string | null;
      address: string | null;
    };

    if (data.createClient === true && data.clientData) {
      // Create new client within the transaction
      // Get next client sequence
      const lastClient = await tx.client.findFirst({
        where: {
          workspaceId,
        },
        orderBy: {
          sequence: "desc",
        },
        select: {
          sequence: true,
        },
      });
      const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

      // Create the client
      const newClient = await tx.client.create({
        data: {
          workspaceId,
          sequence: clientSequence,
          name: data.clientData.name,
          email: data.clientData.email,
          phone: data.clientData.phone,
          address: data.clientData.address,
          nit: data.clientData.nit,
          businessName: data.clientData.businessName,
          reminderBeforeDueIntervalDays:
            data.clientData.reminderBeforeDueIntervalDays,
          reminderAfterDueIntervalDays:
            data.clientData.reminderAfterDueIntervalDays,
        },
      });

      clientId = newClient.id;
      client = {
        id: newClient.id,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
      };
    } else {
      // Use existing client
      if (!data.clientId) {
        throw new EntityValidationError({
          message: "Client ID is required when not creating a new client",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }

      const existingClient = await tx.client.findUnique({
        where: { id: data.clientId },
      });

      if (!existingClient) {
        throw new EntityValidationError({
          message: "Client not found",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }

      clientId = existingClient.id;
      client = {
        id: existingClient.id,
        email: existingClient.email,
        phone: existingClient.phone,
        address: existingClient.address,
      };
    }

    // Use provided invoice-specific fields or fallback to client defaults
    const clientEmail = client.email;
    const clientPhone = client.phone;
    const clientAddress = client.address;

    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        workspaceId,
        businessId: data.businessId,
        sequence,
        clientId: clientId,
        invoiceNumber,
        status: "DRAFT",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        purchaseOrder: data.purchaseOrder,
        customHeader: data.customHeader,
        currency: data.currency,
        clientEmail,
        clientPhone,
        clientAddress,
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        discount: data.discount,
        discountType: data.discountType,
        taxMode: data.taxMode,
        taxName: data.taxName || null,
        taxPercentage: data.taxPercentage || null,
        total: totals.total,
        balance: totals.total,
        notes: data.notes,
        terms: data.terms,
        selectedPaymentMethodId: data.selectedPaymentMethodId ?? null,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
        client: true,
        business: true,
      },
    });

    return {
      ...invoice,
      business: {
        ...invoice.business,
        defaultTaxPercentage: invoice.business.defaultTaxPercentage
          ? Number(invoice.business.defaultTaxPercentage)
          : null,
        defaultTaxMode: invoice.business.defaultTaxMode,
      },
      sequence: Number(invoice.sequence),
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      discount: Number(invoice.discount),
      taxPercentage: invoice.taxPercentage
        ? Number(invoice.taxPercentage)
        : null,
      total: Number(invoice.total),
      balance: Number(invoice.balance),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })),
    };
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

    if (!existingInvoice || existingInvoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (existingInvoice.status !== "DRAFT") {
      throw new EntityValidationError({
        message: "Cannot update a sent invoice",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // If items are being updated, recalculate totals
    const {
      clientId,
      items,
      clientEmail,
      clientPhone,
      clientAddress,
      createClient,
      clientData,
      selectedPaymentMethodId,
      ...invoiceData
    } = data;
    let updateData: Prisma.InvoiceUpdateInput = { ...invoiceData };

    // Handle client creation or selection
    let newClientId: number | undefined;

    if (data.createClient === true && data.clientData) {
      // Create new client within the transaction
      // Get next client sequence
      const lastClient = await tx.client.findFirst({
        where: {
          workspaceId,
        },
        orderBy: {
          sequence: "desc",
        },
        select: {
          sequence: true,
        },
      });
      const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

      // Create the client
      const newClient = await tx.client.create({
        data: {
          workspaceId,
          sequence: clientSequence,
          name: data.clientData.name,
          email: data.clientData.email,
          phone: data.clientData.phone,
          address: data.clientData.address,
          nit: data.clientData.nit,
          businessName: data.clientData.businessName,
          reminderBeforeDueIntervalDays:
            data.clientData.reminderBeforeDueIntervalDays,
          reminderAfterDueIntervalDays:
            data.clientData.reminderAfterDueIntervalDays,
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
        throw new EntityValidationError({
          message: "Client not found",
          statusCode: 400,
          code: "ERR_VALID",
        });
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
        where: { invoiceId: id },
        data: { tax: 0, vatEnabled: false },
      });

      const invoiceItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });

      const itemsToUpdate = invoiceItems.map((item) => ({
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        discountType: item.discountType,
        tax: Number(item.tax),
        vatEnabled: item.vatEnabled,
      }));

      // Recalculate totals with cleared tax data
      const totalsAfterClear = calculateInvoiceTotals(
        {
          discount:
            data.discount !== undefined
              ? data.discount
              : Number(existingInvoice.discount),
          discountType:
            data.discountType !== undefined
              ? data.discountType
              : existingInvoice.discountType,
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
    const effectiveTaxMode = data.taxMode || existingInvoice.taxMode;
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
        where: {
          invoiceId: id,
        },
        data: {
          tax: effectiveTaxPercentage,
          vatEnabled: effectiveTaxPercentage !== 0,
        },
      });
    }

    if (taxModeChanged || discountChanged || taxPercentageChanged) {
      const invoiceItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });

      const itemsToUpdate = invoiceItems.map((item) => ({
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        discountType: item.discountType,
        tax: Number(item.tax),
        vatEnabled: item.vatEnabled,
      }));

      const totals = calculateInvoiceTotals(
        {
          discount:
            data.discount !== undefined
              ? data.discount
              : Number(existingInvoice.discount),
          discountType:
            data.discountType !== undefined
              ? data.discountType
              : existingInvoice.discountType,
          taxMode: data.taxMode || existingInvoice.taxMode,
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
      where: { id, workspaceId },
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
        items: true,
        client: true,
        business: true,
        selectedPaymentMethod: true,
      },
    });

    await updateInvoiceBalanceAndStatus(tx, id, Number(updatedInvoice.total));

    const withBalance = await tx.invoice.findUnique({
      where: { id, workspaceId },
      select: { balance: true },
    });

    return {
      ...updatedInvoice,
      business: {
        ...updatedInvoice.business,
        defaultTaxPercentage: updatedInvoice.business.defaultTaxPercentage
          ? Number(updatedInvoice.business.defaultTaxPercentage)
          : null,
        defaultTaxMode: updatedInvoice.business.defaultTaxMode,
      },
      subtotal: Number(updatedInvoice.subtotal),
      totalTax: Number(updatedInvoice.totalTax),
      discount: Number(updatedInvoice.discount),
      taxPercentage: updatedInvoice.taxPercentage
        ? Number(updatedInvoice.taxPercentage)
        : null,
      total: Number(updatedInvoice.total),
      balance: Number(withBalance?.balance ?? updatedInvoice.balance),
      items: updatedInvoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })),
      selectedPaymentMethod: updatedInvoice.selectedPaymentMethod ?? undefined,
    };
  });
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existingInvoice || existingInvoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (existingInvoice.status !== "DRAFT") {
      throw new EntityValidationError({
        message: "Cannot delete a non-draft invoice",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    if (existingInvoice.payments.length > 0) {
      throw new EntityValidationError({
        message: "Cannot delete an invoice with payments",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    await tx.invoice.delete({
      where: { id },
    });
  });
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
    where: {
      id: invoiceId,
    },
    include: { _count: { select: { items: true } } },
  });

  if (!invoice || invoice.workspaceId !== workspaceId) {
    throw new EntityNotFoundError({
      message: "Invoice not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  if (invoice._count.items === 0) {
    throw new EntityValidationError({
      message: "Cannot send an invoice with no items",
      statusCode: 400,
      code: "ERR_VALID",
    });
  }

  // Idempotent: if already sent (SENT, VIEWED, or PAID), don't overwrite status—return current state
  if (["SENT", "VIEWED", "PAID"].includes(invoice.status) && invoice.sentAt) {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { business: true, client: true },
    });
    if (!existing)
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    return {
      ...existing,
      business: {
        ...existing.business,
        defaultTaxPercentage: existing.business.defaultTaxPercentage
          ? Number(existing.business.defaultTaxPercentage)
          : null,
        defaultTaxMode: existing.business.defaultTaxMode,
      },
      subtotal: Number(existing.subtotal),
      totalTax: Number(existing.totalTax),
      discount: Number(existing.discount),
      taxPercentage: existing.taxPercentage
        ? Number(existing.taxPercentage)
        : null,
      total: Number(existing.total),
      balance: Number(existing.balance),
    };
  }

  const updatedInvoice = await prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },

    include: {
      business: true,
      client: true,
    },
  });

  return {
    ...updatedInvoice,
    business: {
      ...updatedInvoice.business,
      defaultTaxPercentage: updatedInvoice.business.defaultTaxPercentage
        ? Number(updatedInvoice.business.defaultTaxPercentage)
        : null,
      defaultTaxMode: updatedInvoice.business.defaultTaxMode,
    },
    subtotal: Number(updatedInvoice.subtotal),
    totalTax: Number(updatedInvoice.totalTax),
    discount: Number(updatedInvoice.discount),
    taxPercentage: updatedInvoice.taxPercentage
      ? Number(updatedInvoice.taxPercentage)
      : null,
    total: Number(updatedInvoice.total),
    balance: Number(updatedInvoice.balance),
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

  if (!invoice || invoice.workspaceId !== workspaceId) {
    return;
  }

  if (invoice.status !== "SENT") {
    return;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "DRAFT",
      sentAt: null,
    },
  });
}

// ===== INVOICE ITEM OPERATIONS =====

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

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError({
        message: "Cannot add item to a non-draft invoice",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Handle catalog integration if needed
    let catalogId: number | null = null;

    // If catalogId is provided directly, use it (when adding from existing catalog)
    if (data.catalogId) {
      // Verify catalog exists and belongs to the invoice's business
      const catalog = await tx.catalog.findUnique({
        where: { id: data.catalogId },
      });

      if (!catalog) {
        throw new EntityNotFoundError({
          message: "Catalog item not found",
          statusCode: 404,
          code: "ERR_NF",
        });
      }

      if (catalog.businessId !== invoice.businessId) {
        throw new EntityValidationError({
          message: "Catalog item does not belong to the invoice's business",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }

      catalogId = data.catalogId;
    } else if (data.saveToCatalog) {
      // Create new catalog entry or link to existing one by name
      catalogId = await handleCatalogIntegration(
        tx,
        workspaceId,
        invoice.businessId,
        {
          name: data.name,
          description: data.description,
          price: data.unitPrice,
          quantityUnit: data.quantityUnit,
        },
      );
    }

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = data.taxMode || invoice.taxMode;

    // Prepare invoice update data for tax-related fields
    const invoiceUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: string | null;
      taxPercentage?: number | null;
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
        where: { id: invoiceId },
        data: invoiceUpdateData,
      });
    }

    // Respect effective taxMode when setting tax fields
    let itemTax = 0;
    let itemVatEnabled = false;
    if (effectiveTaxMode === "BY_PRODUCT") {
      // Use tax field, ignore vatEnabled
      itemTax = data.tax || 0;
      itemVatEnabled = false;
    } else if (effectiveTaxMode === "BY_TOTAL") {
      // Use vatEnabled field, set tax to invoice taxPercentage for display if vatEnabled
      itemVatEnabled = data.vatEnabled || false;
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
    const itemTotal = calculateItemTotal(
      {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount,
        discountType: data.discountType,
        tax: itemTax,
        vatEnabled: itemVatEnabled,
      },
      effectiveTaxMode,
      invoice.taxPercentage ? Number(invoice.taxPercentage) : null,
    );

    // Create item
    const item = await tx.invoiceItem.create({
      data: {
        invoiceId,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        unitPrice: data.unitPrice,
        discount: data.discount,
        discountType: data.discountType,
        tax: itemTax,
        vatEnabled: itemVatEnabled,
        total: itemTotal,
        catalogId,
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
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        discountType: i.discountType,
        tax: Number(i.tax),
        vatEnabled: i.vatEnabled,
      })),
    );

    // Prepare final invoice update data
    const finalInvoiceUpdateData: {
      taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      subtotal: number;
      totalTax: number;
      total: number;
      taxName?: string | null;
      taxPercentage?: number | null;
    } = {
      taxMode: effectiveTaxMode, // Ensure taxMode is updated along with totals
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      total: totals.total,
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
      where: { id: invoiceId },
      data: finalInvoiceUpdateData,
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);

    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      total: Number(item.total),
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

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError({
        message: "Cannot update item of a non-draft invoice",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Verify item exists
    const existingItem = await tx.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem || existingItem.invoiceId !== invoiceId) {
      throw new EntityNotFoundError({
        message: "Invoice item not found",
        statusCode: 404,
        code: "ERR_NF",
      });
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
          throw new EntityNotFoundError({
            message: "Catalog item not found",
            statusCode: 404,
            code: "ERR_NF",
          });
        }

        if (catalog.businessId !== invoice.businessId) {
          throw new EntityValidationError({
            message: "Catalog item does not belong to the invoice's business",
            statusCode: 400,
            code: "ERR_VALID",
          });
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
          name: data.name || existingItem.name,
          description: data.description || existingItem.description,
          price:
            data.unitPrice !== undefined
              ? data.unitPrice
              : Number(existingItem.unitPrice),
          quantityUnit: data.quantityUnit || existingItem.quantityUnit,
        },
      );
    }

    // Prepare update data - exclude saveToCatalog, taxMode, taxName, taxPercentage, and catalogId as they're not item database fields
    const {
      saveToCatalog,
      taxMode: passedTaxMode,
      taxName: passedTaxName,
      taxPercentage: passedTaxPercentage,
      catalogId: _catalogId, // Exclude catalogId from itemData, we handle it separately
      ...itemData
    } = data;
    const updateData: Prisma.InvoiceItemUpdateInput = {};

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = passedTaxMode || invoice.taxMode;

    // Prepare invoice update data for tax-related fields
    const invoiceUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: string | null;
      taxPercentage?: number | null;
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
        where: { id: invoiceId },
        data: invoiceUpdateData,
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
        (itemData.vatEnabled !== undefined
          ? itemData.vatEnabled
          : existingItem.vatEnabled) && invoice.taxPercentage;
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
      finalTax = data.tax !== undefined ? data.tax : Number(existingItem.tax);
      finalVatEnabled = false;
    } else if (effectiveTaxMode === "BY_TOTAL") {
      finalVatEnabled =
        data.vatEnabled !== undefined
          ? data.vatEnabled
          : existingItem.vatEnabled;
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
      quantity:
        data.quantity !== undefined
          ? data.quantity
          : Number(existingItem.quantity),
      unitPrice:
        data.unitPrice !== undefined
          ? data.unitPrice
          : Number(existingItem.unitPrice),
      discount:
        data.discount !== undefined
          ? data.discount
          : Number(existingItem.discount),
      discountType:
        data.discountType !== undefined
          ? data.discountType
          : existingItem.discountType,
      tax: finalTax,
      vatEnabled: finalVatEnabled,
    };

    // Use updated taxPercentage if provided, otherwise use invoice's current value
    const effectiveTaxPercentage =
      passedTaxPercentage !== undefined
        ? passedTaxPercentage
        : invoice.taxPercentage
          ? Number(invoice.taxPercentage)
          : null;

    const itemTotal = calculateItemTotal(
      finalItem,
      effectiveTaxMode,
      effectiveTaxPercentage,
    );

    updateData.total = itemTotal;

    // Update item
    const item = await tx.invoiceItem.update({
      where: { id: itemId },
      data: updateData,
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
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        discountType: i.discountType,
        tax: Number(i.tax),
        vatEnabled: i.vatEnabled,
      })),
    );

    // Prepare final invoice update data
    const finalInvoiceUpdateData: {
      taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      subtotal: number;
      totalTax: number;
      total: number;
      taxName?: string | null;
      taxPercentage?: number | null;
    } = {
      taxMode: effectiveTaxMode, // Update invoice taxMode if it changed
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      total: totals.total,
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
      where: { id: invoiceId },
      data: finalInvoiceUpdateData,
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);

    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      total: Number(item.total),
    };
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

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (invoice.status !== "DRAFT") {
      throw new EntityValidationError({
        message: "Cannot delete item from a non-draft invoice",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Verify item exists
    const existingItem = await tx.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem || existingItem.invoiceId !== invoiceId) {
      throw new EntityNotFoundError({
        message: "Invoice item not found",
        statusCode: 404,
        code: "ERR_NF",
      });
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
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        discountType: i.discountType,
        tax: Number(i.tax),
        vatEnabled: i.vatEnabled,
      })),
    );

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        total: totals.total,
      },
    });

    await updateInvoiceBalanceAndStatus(tx, invoiceId, totals.total);
  });
}

// ===== PAYMENT OPERATIONS =====

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
    where: {
      invoiceId,
    },
    select: {
      amount: true,
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
    where: { id: invoiceId },
    select: {
      status: true,
      viewedAt: true,
      paidAt: true,
    },
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
    where: { id: invoiceId },
    data: updateData,
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
      where: { id: invoiceId },
      include: { _count: { select: { items: true } } },
    });

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    if (invoice._count.items === 0) {
      throw new EntityValidationError({
        message: "Cannot add payment to an invoice with no items",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    if (Number(invoice.balance) <= 0) {
      throw new EntityValidationError({
        message: "Cannot add payment: invoice balance is zero or already paid",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Check if transactionId already exists only when provided
    const transactionId = paymentData.transactionId ?? null;

    // Create payment
    const created = await tx.payment.create({
      data: {
        workspaceId,
        invoiceId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionId,
        details: paymentData.details,
        paidAt: paymentData.paidAt || new Date(),
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
    const { sendReceiptQueue } = await import("../../queue/queues");
    await sendReceiptQueue.add("send-receipt", {
      paymentId: payment.id,
      invoiceId,
      workspaceId,
    });
  }

  return payment;
}

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

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    // Verify payment exists
    const existingPayment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment || existingPayment.invoiceId !== invoiceId) {
      throw new EntityNotFoundError({
        message: "Payment not found",
        statusCode: 404,
        code: "ERR_NF",
      });
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
      where: { id: paymentId },
      data: updateData,
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

    if (!invoice || invoice.workspaceId !== workspaceId) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    // Verify payment exists
    const existingPayment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment || existingPayment.invoiceId !== invoiceId) {
      throw new EntityNotFoundError({
        message: "Payment not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    await tx.payment.delete({
      where: { id: paymentId },
    });

    // Update invoice balance and status
    await updateInvoiceBalanceAndStatus(tx, invoiceId, Number(invoice.total));
  });
}
