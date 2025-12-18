import { prisma } from "../../core/db";
import type { Prisma } from "../../generated/prisma/client";
import type {
  ListInvoicesQuery,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceEntity,
  InvoiceItemEntity,
  PaymentEntity,
  CreateInvoiceItemDto,
  UpdateInvoiceItemDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "./invoices.schemas";
import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors";

// ===== HELPER FUNCTIONS =====

/**
 * Calculate item total with discount and tax
 */
function calculateItemTotal(
  item: {
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: "PERCENTAGE" | "FIXED" | "NONE";
    tax: number;
    vatEnabled: boolean;
  },
  invoiceTaxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE",
  invoiceTaxPercentage: number | null
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

  // 4. Final item total
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
  }>
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
  workspaceId: number
): Promise<string> {
  return await getNextInvoiceNumberInternal(tx, workspaceId);
}

/**
 * Get next invoice number for a workspace (standalone version)
 * This version can be used without a transaction
 */
export async function getNextInvoiceNumberForWorkspace(
  workspaceId: number
): Promise<string> {
  return await getNextInvoiceNumberInternal(prisma, workspaceId);
}

/**
 * Internal implementation of getNextInvoiceNumber
 * Works with both Prisma client and transaction client
 */
async function getNextInvoiceNumberInternal(
  client: Prisma.TransactionClient | typeof prisma,
  workspaceId: number
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
        deletedAt: null,
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
      lastInvoiceWithPrefix.invoiceNumber
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
        deletedAt: null,
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
      lastInvoice.invoiceNumber
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
  itemData: {
    name: string;
    description: string;
    price: number;
    quantityUnit: "DAYS" | "HOURS" | "UNITS";
  }
): Promise<number | null> {
  // Check if catalog item with same name exists
  const existingCatalog = await tx.catalog.findFirst({
    where: {
      workspaceId,
      name: itemData.name,
      deletedAt: null,
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
  // First, get next sequence
  const lastCatalog = await tx.catalog.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
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
  query: ListInvoicesQuery
): Promise<{
  invoices: InvoiceEntity[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search, status, clientId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {
    workspaceId,
    deletedAt: null,
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { businessName: { contains: search, mode: "insensitive" } } },
      ],
    }),
    ...(status && { status }),
    ...(clientId && { clientId }),
  };

  const [invoices, total] = await Promise.all([
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
  ]);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      totalTax: Number(inv.totalTax),
      discount: Number(inv.discount),
      taxPercentage: inv.taxPercentage ? Number(inv.taxPercentage) : null,
      total: Number(inv.total),
    })),
    total,
    page,
    limit,
  };
}

/**
 * Get invoice by ID with items and payments
 */
export async function getInvoiceBySequence(
  workspaceId: number,
  sequence: number
): Promise<
  InvoiceEntity & { items: InvoiceItemEntity[]; payments: PaymentEntity[] }
> {
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
        where: { deletedAt: null },
        orderBy: { paidAt: "desc" },
      },
      client: true,
    },
  });

  if (
    !invoice ||
    invoice.deletedAt !== null ||
    invoice.workspaceId !== workspaceId
  ) {
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
  } as InvoiceEntity & {
    items: InvoiceItemEntity[];
    payments: PaymentEntity[];
  };
}

/**
 * Create a new invoice with items
 */
export async function createInvoice(
  workspaceId: number,
  data: CreateInvoiceDto
): Promise<InvoiceEntity & { items: InvoiceItemEntity[] }> {
  return await prisma.$transaction(async (tx) => {
    // Check if workspace has at least one business
    const businessCount = await tx.business.count({
      where: {
        workspaceId,
        deletedAt: null,
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
        deletedAt: null,
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
      invoiceNumber = await getNextInvoiceNumber(tx, workspaceId);
    } else {
      // Check if invoice number already exists
      const existing = await tx.invoice.findUnique({
        where: {
          workspaceId_invoiceNumber: {
            workspaceId,
            invoiceNumber,
          },
        },
      });
      if (existing && existing.deletedAt === null) {
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
            if (item.saveToCatalog) {
              catalogId = await handleCatalogIntegration(tx, workspaceId, {
                name: item.name,
                description: item.description,
                price: item.unitPrice,
                quantityUnit: item.quantityUnit,
              });
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
              data.taxPercentage || null
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
          })
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
      itemsToCreate
    );

    // Get next sequence
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        workspaceId,
        deletedAt: null,
      },
      orderBy: {
        sequence: "desc",
      },
    });
    const sequence = lastInvoice ? lastInvoice.sequence + 1 : 1;

    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        workspaceId,
        businessId: data.businessId,
        sequence,
        clientId: data.clientId,
        invoiceNumber,
        status: "DRAFT",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        purchaseOrder: data.purchaseOrder,
        customHeader: data.customHeader,
        currency: data.currency,
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        discount: data.discount,
        discountType: data.discountType,
        taxMode: data.taxMode,
        taxName: data.taxName || null,
        taxPercentage: data.taxPercentage || null,
        total: totals.total,
        notes: data.notes,
        terms: data.terms,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    return {
      ...invoice,
      sequence: Number(invoice.sequence),
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      discount: Number(invoice.discount),
      taxPercentage: invoice.taxPercentage
        ? Number(invoice.taxPercentage)
        : null,
      total: Number(invoice.total),
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
  data: UpdateInvoiceDto
): Promise<InvoiceEntity & { items: InvoiceItemEntity[] }> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const existingInvoice = await tx.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (
      !existingInvoice ||
      existingInvoice.deletedAt !== null ||
      existingInvoice.workspaceId !== workspaceId
    ) {
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
    const { clientId, items, ...invoiceData } = data;
    let updateData: Prisma.InvoiceUpdateInput = { ...invoiceData };
    let itemsToUpdate: InvoiceItemEntity[] = existingInvoice.items.map(
      (item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })
    );

    if (data.items) {
      // TODO: not delete all to restart
      // Delete existing items and create new ones
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Create new items
      const newItems = await Promise.all(
        data.items.map(async (item) => {
          let catalogId: number | null = null;
          if (item.saveToCatalog) {
            catalogId = await handleCatalogIntegration(tx, workspaceId, {
              name: item.name,
              description: item.description,
              price: item.unitPrice,
              quantityUnit: item.quantityUnit,
            });
          }

          // Determine effective taxMode and taxPercentage
          const effectiveTaxMode = data.taxMode || existingInvoice.taxMode;
          const effectiveTaxPercentage =
            data.taxPercentage !== undefined
              ? data.taxPercentage
              : existingInvoice.taxPercentage
              ? Number(existingInvoice.taxPercentage)
              : null;

          // Determine item tax value based on taxMode
          let itemTax = 0;
          const itemVatEnabled = item.vatEnabled || false;
          if (effectiveTaxMode === "BY_PRODUCT") {
            itemTax = item.tax || 0;
          } else if (effectiveTaxMode === "BY_TOTAL") {
            // For BY_TOTAL mode, set tax to invoice taxPercentage for display if vatEnabled
            itemTax =
              itemVatEnabled && effectiveTaxPercentage
                ? effectiveTaxPercentage
                : 0;
          }

          const itemTotal = calculateItemTotal(
            {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              discountType: item.discountType,
              tax: itemTax,
              vatEnabled: itemVatEnabled,
            },
            effectiveTaxMode,
            effectiveTaxPercentage
          );

          return await tx.invoiceItem.create({
            data: {
              invoiceId: id,
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
            },
          });
        })
      );

      itemsToUpdate = newItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      }));

      // Recalculate totals
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
        itemsToUpdate
      );

      updateData.subtotal = totals.subtotal;
      updateData.totalTax = totals.totalTax;
      updateData.total = totals.total;

      // If taxMode changed to NONE, clear tax data on all items
      const taxModeChanged =
        data.taxMode !== undefined && data.taxMode !== existingInvoice.taxMode;
      const taxPercentageChanged = data.taxPercentage !== undefined;
      if (taxModeChanged && data.taxMode === "NONE") {
        await tx.invoiceItem.updateMany({
          where: { invoiceId: id },
          data: { tax: 0, vatEnabled: false },
        });
        // Update itemsToUpdate array to reflect cleared tax data
        itemsToUpdate = itemsToUpdate.map((item) => ({
          ...item,
          tax: 0,
          vatEnabled: false,
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
          itemsToUpdate
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

      // If taxMode is BY_TOTAL and taxPercentage changed, update all items with vatEnabled
      const effectiveTaxMode = data.taxMode || existingInvoice.taxMode;
      const effectiveTaxPercentage =
        data.taxPercentage !== undefined
          ? data.taxPercentage
          : existingInvoice.taxPercentage
          ? Number(existingInvoice.taxPercentage)
          : null;
      if (
        effectiveTaxMode === "BY_TOTAL" &&
        taxPercentageChanged &&
        effectiveTaxPercentage !== null
      ) {
        await tx.invoiceItem.updateMany({
          where: {
            invoiceId: id,
            vatEnabled: true,
          },
          data: {
            tax: effectiveTaxPercentage,
          },
        });
      }
    } else {
      // Just update invoice fields, recalculate if tax/discount changed
      const taxModeChanged =
        data.taxMode !== undefined && data.taxMode !== existingInvoice.taxMode;
      const discountChanged =
        data.discount !== undefined || data.discountType !== undefined;
      const taxPercentageChanged = data.taxPercentage !== undefined;

      if (taxModeChanged || discountChanged || taxPercentageChanged) {
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
          itemsToUpdate
        );

        updateData.subtotal = totals.subtotal;
        updateData.totalTax = totals.totalTax;
        updateData.total = totals.total;
      }

      // If taxMode changed to NONE, clear tax data on all items
      if (taxModeChanged && data.taxMode === "NONE") {
        await tx.invoiceItem.updateMany({
          where: { invoiceId: id },
          data: { tax: 0, vatEnabled: false },
        });
        // Re-fetch items after clearing tax data for accurate totals
        itemsToUpdate = itemsToUpdate.map((item) => ({
          ...item,
          tax: 0,
          vatEnabled: false,
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
          itemsToUpdate
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
            vatEnabled: true,
          },
          data: {
            tax: effectiveTaxPercentage,
          },
        });
      }
    }

    const updatedInvoice = await tx.invoice.update({
      where: { id, workspaceId },
      data: {
        ...updateData,
        client: {
          connect: clientId ? { id: clientId } : undefined,
        },
      },
      include: { items: true },
    });

    return {
      ...updatedInvoice,
      subtotal: Number(updatedInvoice.subtotal),
      totalTax: Number(updatedInvoice.totalTax),
      discount: Number(updatedInvoice.discount),
      taxPercentage: updatedInvoice.taxPercentage
        ? Number(updatedInvoice.taxPercentage)
        : null,
      total: Number(updatedInvoice.total),
      items: updatedInvoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })) as InvoiceItemEntity[],
    } as InvoiceEntity & { items: InvoiceItemEntity[] };
  });
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(
  workspaceId: number,
  id: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (
      !existingInvoice ||
      existingInvoice.deletedAt !== null ||
      existingInvoice.workspaceId !== workspaceId
    ) {
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
  invoiceId: number
): Promise<InvoiceEntity> {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
  });

  if (
    !invoice ||
    invoice.deletedAt !== null ||
    invoice.workspaceId !== workspaceId
  ) {
    throw new EntityNotFoundError({
      message: "Invoice not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  // Only update if not already sent (idempotent)
  if (invoice.status === "SENT" && invoice.sentAt) {
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      discount: Number(invoice.discount),
      taxPercentage: invoice.taxPercentage
        ? Number(invoice.taxPercentage)
        : null,
      total: Number(invoice.total),
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
  });

  return {
    ...updatedInvoice,
    subtotal: Number(updatedInvoice.subtotal),
    totalTax: Number(updatedInvoice.totalTax),
    discount: Number(updatedInvoice.discount),
    taxPercentage: updatedInvoice.taxPercentage
      ? Number(updatedInvoice.taxPercentage)
      : null,
    total: Number(updatedInvoice.total),
  };
}

/**
 * Mark an invoice as paid
 * Updates status to PAID and sets paidAt timestamp
 * Only allows marking as paid if status is SENT, VIEWED, or PENDING (not DRAFT)
 */
export async function markInvoiceAsPaid(
  workspaceId: number,
  invoiceId: number
): Promise<InvoiceEntity> {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
  });

  if (
    !invoice ||
    invoice.deletedAt !== null ||
    invoice.workspaceId !== workspaceId
  ) {
    throw new EntityNotFoundError({
      message: "Invoice not found",
      statusCode: 404,
      code: "ERR_NF",
    });
  }

  // Only update if not already paid (idempotent)
  if (invoice.status === "PAID" && invoice.paidAt) {
    throw new EntityValidationError({
      message: "Invoice already paid",
      statusCode: 400,
      code: "ERR_VALID",
    });
  }

  const updatedInvoice = await prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  return {
    ...updatedInvoice,
    subtotal: Number(updatedInvoice.subtotal),
    totalTax: Number(updatedInvoice.totalTax),
    discount: Number(updatedInvoice.discount),
    taxPercentage: updatedInvoice.taxPercentage
      ? Number(updatedInvoice.taxPercentage)
      : null,
    total: Number(updatedInvoice.total),
  };
}

// ===== INVOICE ITEM OPERATIONS =====

/**
 * Add an invoice item
 */
export async function addInvoiceItem(
  workspaceId: number,
  invoiceId: number,
  data: Omit<CreateInvoiceItemDto, "invoiceId">
): Promise<InvoiceItemEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
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
    if (data.saveToCatalog) {
      catalogId = await handleCatalogIntegration(tx, workspaceId, {
        name: data.name,
        description: data.description,
        price: data.unitPrice,
        quantityUnit: data.quantityUnit,
      });
    }

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = data.taxMode || invoice.taxMode;

    // If taxMode was passed and differs from invoice, update the invoice
    if (data.taxMode && data.taxMode !== invoice.taxMode) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { taxMode: data.taxMode },
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
      invoice.taxPercentage ? Number(invoice.taxPercentage) : null
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

    const totals = calculateInvoiceTotals(
      {
        discount: Number(invoice.discount),
        discountType: invoice.discountType,
        taxMode: effectiveTaxMode,
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
      }))
    );

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        taxMode: effectiveTaxMode, // Ensure taxMode is updated along with totals
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        total: totals.total,
      },
    });

    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      total: Number(item.total),
    } as InvoiceItemEntity;
  });
}

/**
 * Update an invoice item
 */
export async function updateInvoiceItem(
  workspaceId: number,
  invoiceId: number,
  itemId: number,
  data: UpdateInvoiceItemDto
): Promise<InvoiceItemEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
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
    if (data.saveToCatalog && !itemCatalogId) {
      itemCatalogId = await handleCatalogIntegration(tx, workspaceId, {
        name: data.name || existingItem.name,
        description: data.description || existingItem.description,
        price:
          data.unitPrice !== undefined
            ? data.unitPrice
            : Number(existingItem.unitPrice),
        quantityUnit: data.quantityUnit || existingItem.quantityUnit,
      });
    }

    // Prepare update data - exclude saveToCatalog and taxMode as they're not item database fields
    const { saveToCatalog, taxMode: passedTaxMode, ...itemData } = data;
    const updateData: Prisma.InvoiceItemUpdateInput = {};

    // Determine effective taxMode - use passed taxMode or fallback to invoice's
    const effectiveTaxMode = passedTaxMode || invoice.taxMode;

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
      data.saveToCatalog === false &&
      existingItem.catalogId !== null
    ) {
      // If explicitly set to false and item has a catalog, disconnect it
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

    const itemTotal = calculateItemTotal(
      finalItem,
      effectiveTaxMode,
      invoice.taxPercentage ? Number(invoice.taxPercentage) : null
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
      }))
    );

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        taxMode: effectiveTaxMode, // Update invoice taxMode if it changed
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        total: totals.total,
      },
    });

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
  itemId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
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
      }))
    );

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: totals.subtotal,
        totalTax: totals.totalTax,
        total: totals.total,
      },
    });
  });
}

// ===== PAYMENT OPERATIONS =====

/**
 * Add a payment to an invoice
 */
export async function addPayment(
  workspaceId: number,
  invoiceId: number,
  data: Omit<CreatePaymentDto, "invoiceId">
): Promise<PaymentEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
      throw new EntityNotFoundError({
        message: "Invoice not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    // Check if transactionId already exists
    const existingPayment = await tx.payment.findUnique({
      where: { transactionId: data.transactionId },
    });

    if (existingPayment) {
      throw new EntityValidationError({
        message: "Transaction ID already exists",
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Create payment
    const payment = await tx.payment.create({
      data: {
        workspaceId,
        invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        details: data.details,
        paidAt: data.paidAt || new Date(),
      },
    });

    return {
      ...payment,
      amount: Number(payment.amount),
    } as PaymentEntity;
  });
}

/**
 * Update a payment
 */
export async function updatePayment(
  workspaceId: number,
  invoiceId: number,
  paymentId: number,
  data: UpdatePaymentDto
): Promise<PaymentEntity> {
  return await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
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

    if (
      !existingPayment ||
      existingPayment.invoiceId !== invoiceId ||
      existingPayment.deletedAt !== null
    ) {
      throw new EntityNotFoundError({
        message: "Payment not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    // Check transactionId uniqueness if being updated
    if (
      data.transactionId &&
      data.transactionId !== existingPayment.transactionId
    ) {
      const duplicatePayment = await tx.payment.findUnique({
        where: { transactionId: data.transactionId },
      });

      if (duplicatePayment) {
        throw new EntityValidationError({
          message: "Transaction ID already exists",
          statusCode: 400,
          code: "ERR_VALID",
        });
      }
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
  paymentId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify invoice exists and belongs to workspace
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (
      !invoice ||
      invoice.deletedAt !== null ||
      invoice.workspaceId !== workspaceId
    ) {
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

    if (
      !existingPayment ||
      existingPayment.invoiceId !== invoiceId ||
      existingPayment.deletedAt !== null
    ) {
      throw new EntityNotFoundError({
        message: "Payment not found",
        statusCode: 404,
        code: "ERR_NF",
      });
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        deletedAt: new Date(),
      },
    });
  });
}
