/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  CreateEstimateDTO,
  CreateEstimateItemDTO,
  EstimateItemResponse,
  EstimateResponse,
  UpdateEstimateDTO,
  UpdateEstimateItemDTO,
} from "@addinvoice/schemas";

import { prisma, type Prisma } from "@addinvoice/db";
import { randomUUID } from "node:crypto";

import type { ListEstimatesQuery } from "./estimates.schemas.js";

import { uploadEstimateSignatureFromDataUrl } from "../../core/cloudinary.js";
import {
  EntityNotFoundError,
  EntityValidationError,
  FieldValidationError,
  GoneError,
} from "../../errors/EntityErrors.js";
import { sendInvoiceQueue } from "../../queue/queues.js";
import {
  createInvoiceFromEstimate,
  markInvoiceAsSent,
} from "../invoices/invoices.service.js";
import { resolveSelectedPaymentMethodId } from "../workspace/payment-method-resolver.service.js";

// ===== HELPER FUNCTIONS =====

/**
 * Add an estimate item
 */
export async function addEstimateItem(
  workspaceId: number,
  estimateId: number,
  data: Omit<CreateEstimateItemDTO, "estimateId">,
): Promise<EstimateItemResponse> {
  return await prisma.$transaction(async (tx) => {
    // Verify estimate exists and belongs to workspace
    const estimate = await tx.estimate.findUnique({
      where: { id: estimateId },
    });

    if (estimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (estimate.status !== "DRAFT") {
      throw new EntityValidationError(
        "Cannot add item to a non-draft estimate",
      );
    }

    // Handle catalog integration if needed
    let catalogId: null | number = null;

    // If catalogId is provided directly, use it (when adding from existing catalog)
    if (data.catalogId) {
      // Verify catalog exists and belongs to the estimate's business
      const catalog = await tx.catalog.findUnique({
        where: { id: data.catalogId },
      });

      if (!catalog) {
        throw new EntityNotFoundError("Catalog item not found");
      }

      if (catalog.businessId !== estimate.businessId) {
        throw new EntityValidationError(
          "Catalog item does not belong to the estimate's business",
        );
      }

      catalogId = data.catalogId;
    } else if (data.saveToCatalog) {
      // Create new catalog entry or link to existing one by name
      catalogId = await handleCatalogIntegration(
        tx,
        workspaceId,
        estimate.businessId,
        {
          description: data.description,
          name: data.name,
          price: data.unitPrice,
          quantityUnit: data.quantityUnit,
        },
      );
    }

    // Determine effective taxMode - use passed taxMode or fallback to estimate's
    const effectiveTaxMode = data.taxMode ?? estimate.taxMode;

    // Prepare estimate update data for tax-related fields
    const estimateUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
    } = {};

    // If taxMode was passed and differs from estimate, update the estimate
    if (data.taxMode && data.taxMode !== estimate.taxMode) {
      estimateUpdateData.taxMode = data.taxMode;
    }

    // If taxMode is BY_TOTAL and taxName/taxPercentage are provided, update them
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (data.taxName !== undefined || data.taxPercentage !== undefined)
    ) {
      if (data.taxName !== undefined) {
        estimateUpdateData.taxName = data.taxName;
      }
      if (data.taxPercentage !== undefined) {
        estimateUpdateData.taxPercentage = data.taxPercentage;
      }
    }

    // Update estimate if there are tax-related changes
    if (Object.keys(estimateUpdateData).length > 0) {
      await tx.estimate.update({
        data: estimateUpdateData,
        where: { id: estimateId },
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
      // Use vatEnabled field, set tax to estimate taxPercentage for display if vatEnabled
      itemVatEnabled = data.vatEnabled ?? false;
      itemTax =
        itemVatEnabled && estimate.taxPercentage
          ? Number(estimate.taxPercentage)
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
    const item = await tx.estimateItem.create({
      data: {
        catalogId,
        description: data.description,
        discount: data.discount,
        discountType: data.discountType,
        estimateId,
        name: data.name,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        tax: itemTax,
        total: itemTotal,
        unitPrice: data.unitPrice,
        vatEnabled: itemVatEnabled,
      },
    });

    // Recalculate estimate totals
    const allItems = await tx.estimateItem.findMany({
      where: { estimateId },
    });

    // Use updated taxPercentage if provided, otherwise use estimate's current value
    const effectiveTaxPercentage =
      data.taxPercentage !== undefined
        ? data.taxPercentage
        : estimate.taxPercentage
          ? Number(estimate.taxPercentage)
          : null;

    const totals = calculateEstimateTotals(
      {
        discount: Number(estimate.discount),
        discountType: estimate.discountType,
        taxMode: effectiveTaxMode,
        taxPercentage: effectiveTaxPercentage,
      },
      toEstimateTotalsItems(allItems),
    );

    // Prepare final estimate update data
    const finalEstimateUpdateData: {
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
        finalEstimateUpdateData.taxName = data.taxName;
      }
      if (data.taxPercentage !== undefined) {
        finalEstimateUpdateData.taxPercentage = data.taxPercentage;
      }
    }

    await tx.estimate.update({
      data: finalEstimateUpdateData,
      where: { id: estimateId },
    });

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
 * Convert an accepted estimate to an invoice.
 * - Estimate must exist and belong to workspace
 * - Status must be ACCEPTED
 * - Must not be already converted
 */
export async function convertEstimateToInvoice(
  workspaceId: number,
  sequence: number,
): Promise<{ id: number; invoiceNumber: string; sequence: number }> {
  const conversion = await prisma.$transaction(async (tx) => {
    const estimate = await tx.estimate.findUnique({
      where: {
        workspaceId_sequence: {
          workspaceId,
          sequence,
        },
      },
      include: {
        items: true,
        business: true,
        client: true,
      },
    });

    if (!estimate) {
      throw new EntityNotFoundError("Estimate not found");
    }

    // Extra safety if unique constraint isn't used in some environments/mocks
    if (estimate.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (estimate.status !== "ACCEPTED") {
      throw new EntityValidationError(
        "Only accepted estimates can be converted to an invoice",
      );
    }

    if (estimate.convertedToInvoiceId) {
      throw new EntityValidationError(
        "This estimate has already been converted to an invoice",
      );
    }

    const recipientEmail = estimate.clientEmail;

    const validatedPaymentMethodId = await resolveSelectedPaymentMethodId(
      tx,
      workspaceId,
      estimate.selectedPaymentMethodId ?? null,
      { useWorkspaceDefaultWhenNull: false },
    );

    const invoice = await createInvoiceFromEstimate(
      workspaceId,
      estimate,
      tx,
      validatedPaymentMethodId,
    );

    await tx.estimate.update({
      data: {
        convertedToInvoiceId: invoice.id,
        status: "INVOICED",
      },
      where: { id: estimate.id },
    });

    return {
      clientEmail: recipientEmail,
      businessName: estimate.business.name,
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sequence: invoice.sequence,
    };
  });

  await sendInvoiceQueue.add("send-invoice", {
    email: conversion.clientEmail,
    invoiceId: conversion.id,
    message: `Your accepted estimate has been converted to an invoice. Please find the invoice ${conversion.invoiceNumber} attached.`,
    sequence: conversion.sequence,
    subject: `Invoice ${conversion.invoiceNumber} from ${conversion.businessName}`,
    workspaceId,
  });

  return {
    id: conversion.id,
    invoiceNumber: conversion.invoiceNumber,
    sequence: conversion.sequence,
  };
}

/**
 * Mark an estimate as accepted (authenticated workspace action).
 */
export async function markEstimateAsAccepted(
  workspaceId: number,
  estimateId: number,
): Promise<EstimateResponse> {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
  });

  if (estimate?.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Estimate not found");
  }

  const updated = await prisma.estimate.update({
    data: {
      acceptedAt: new Date(),
      status: "ACCEPTED",
      acceptedBy: "CLIENT",
    },
    include: { business: true, client: true, items: true },
    where: { id: estimateId },
  });

  return {
    ...updated,
    signatureData: updated.signatureData as unknown as
      | null
      | Record<string, unknown>
      | undefined,
    business: {
      ...updated.business,
      defaultTaxMode: updated.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: updated.business.defaultTaxPercentage
        ? Number(updated.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(updated.discount),
    items: updated.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    subtotal: Number(updated.subtotal),
    taxPercentage: updated.taxPercentage ? Number(updated.taxPercentage) : null,
    total: Number(updated.total),
    totalTax: Number(updated.totalTax),
  };
}

/**
 * Public (no-auth) helpers for accepting/rejecting via signing token.
 */
export async function getEstimateBySigningToken(
  token: string,
): Promise<EstimateResponse> {
  const estimate = await prisma.estimate.findFirst({
    where: { signingToken: token },
    include: { business: true, client: true, items: true },
  });

  if (!estimate) {
    throw new EntityNotFoundError("Estimate not found");
  }

  if (
    estimate.signingTokenExpiresAt &&
    estimate.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (["ACCEPTED", "INVOICED", "REJECTED"].includes(estimate.status)) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  return {
    ...estimate,
    signatureData: estimate.signatureData,
    business: {
      ...estimate.business,
      defaultTaxMode: estimate.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: estimate.business.defaultTaxPercentage
        ? Number(estimate.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(estimate.discount),
    items: estimate.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    subtotal: Number(estimate.subtotal),
    taxPercentage: estimate.taxPercentage
      ? Number(estimate.taxPercentage)
      : null,
    total: Number(estimate.total),
    totalTax: Number(estimate.totalTax),
  };
}

export async function acceptEstimateByToken(
  token: string,
  body: { fullName: string; signatureData?: unknown },
): Promise<void> {
  const estimate = await prisma.estimate.findFirst({
    where: { signingToken: token },
  });

  if (!estimate) throw new EntityNotFoundError("Estimate not found");

  if (
    estimate.signingTokenExpiresAt &&
    estimate.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (estimate.status === "ACCEPTED") {
    throw new EntityValidationError("Estimate already accepted");
  }

  const rawSignatureData =
    body.signatureData && typeof body.signatureData === "object"
      ? (body.signatureData as Record<string, unknown>)
      : null;

  const rawSignatureImage =
    rawSignatureData && typeof rawSignatureData.signatureImage === "string"
      ? rawSignatureData.signatureImage
      : null;

  // If signature is required, enforce it end-to-end (not just UI-level).
  if (estimate.requireSignature) {
    if (!rawSignatureImage || rawSignatureImage.trim().length === 0) {
      throw new EntityValidationError("Signature image is required");
    }
  }

  let signatureImageUrl: string | undefined;
  if (rawSignatureImage && rawSignatureImage.trim().length > 0) {
    const uploadResult = await uploadEstimateSignatureFromDataUrl(
      rawSignatureImage,
      estimate.workspaceId,
      estimate.id,
    );
    signatureImageUrl = uploadResult.secure_url;
  }

  const finalSignatureData: Record<string, unknown> = {
    fullName: body.fullName.trim(),
    signedAt: new Date().toISOString(),
    ...(signatureImageUrl ? { signatureImageUrl } : {}),
  };

  await prisma.estimate.update({
    data: {
      acceptedAt: new Date(),
      acceptedBy: "END_CUSTOMER",
      signatureData: finalSignatureData as Prisma.InputJsonValue,
      signingToken: null,
      signingTokenExpiresAt: null,
      status: "ACCEPTED",
    },
    where: { id: estimate.id },
  });
}

export async function rejectEstimateByToken(
  token: string,
  body: { rejectionReason?: string },
): Promise<void> {
  const estimate = await prisma.estimate.findFirst({
    where: { signingToken: token },
  });

  if (!estimate) throw new EntityNotFoundError("Estimate not found");

  if (
    estimate.signingTokenExpiresAt &&
    estimate.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (estimate.status === "ACCEPTED") {
    throw new EntityValidationError("Estimate already accepted");
  }

  await prisma.estimate.update({
    data: {
      status: "REJECTED",
      signingToken: null,
      signingTokenExpiresAt: null,
      // Keep reason in notes for now; you may want a dedicated column later.
      notes: body.rejectionReason
        ? [estimate.notes, body.rejectionReason].filter(Boolean).join("\n\n")
        : estimate.notes,
    },
    where: { id: estimate.id },
  });
}

/**
 * Build the payload expected by the PDF service for estimate generation.
 * Shape must match pdf-service estimatePdfPayloadSchema.
 */
export function buildEstimatePdfPayload(estimate: EstimateResponse): {
  client: {
    address: null | string;
    businessName: null | string;
    email: null | string;
    name: string;
    nit: null | string;
    phone: null | string;
  };
  company: {
    address: null | string;
    email: null | string;
    logo: null | string;
    name: string;
    nit: null | string;
    phone: null | string;
  };
  invoice: {
    currency: string;
    discount: number;
    documentType: "estimate";
    invoiceNumber: string;
    notes: null | string;
    status: string;
    subtotal: number;
    summary: null | string;
    terms: null | string;
    timelineEndDate: Date | null | string;
    timelineStartDate: Date | null | string;
    total: number;
    totalTax: number;
  };
  items: {
    description: null | string;
    discount: number;
    discountAmount?: number;
    name: string;
    quantity: number;
    quantityUnit: null | string;
    tax?: number;
    total: number;
    unitPrice: number;
  }[];
  paymentMethod: null;
} {
  const estimateDiscountFixed =
    estimate.discountType === "PERCENTAGE"
      ? (estimate.subtotal * estimate.discount) / 100
      : estimate.discountType === "FIXED"
        ? estimate.discount
        : 0;

  return {
    client: {
      address: estimate.client.address ?? null,
      businessName: estimate.client.businessName ?? null,
      email: estimate.client.email,
      name: estimate.client.name,
      nit: estimate.client.nit ?? null,
      phone: estimate.client.phone ?? null,
    },
    company: {
      address: estimate.business.address,
      email: estimate.business.email,
      logo: estimate.business.logo ?? null,
      name: estimate.business.name,
      nit: estimate.business.nit ?? null,
      phone: estimate.business.phone,
    },
    invoice: {
      currency: estimate.currency,
      discount: estimateDiscountFixed,
      documentType: "estimate",
      invoiceNumber: estimate.estimateNumber,
      summary: estimate.summary ?? null,
      timelineEndDate: estimate.timelineEndDate ?? null,
      timelineStartDate: estimate.timelineStartDate ?? null,
      notes: estimate.notes ?? null,
      status: estimate.status,
      subtotal: estimate.subtotal,
      terms: estimate.terms ?? null,
      total: estimate.total,
      totalTax: estimate.totalTax,
    },
    items: (estimate.items ?? []).map((item: EstimateItemResponse) => {
      const base = item.quantity * item.unitPrice;
      const discountAmount =
        item.discountType === "PERCENTAGE"
          ? (base * item.discount) / 100
          : item.discountType === "FIXED"
            ? item.discount
            : 0;
      return {
        discount: discountAmount,
        discountAmount,
        description: item.description,
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        tax: item.tax,
        total: item.total,
        unitPrice: item.unitPrice,
      };
    }),
    paymentMethod: null,
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
  // estimateTaxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE",
  // estimateTaxPercentage: null | number,
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
  // if (estimateTaxMode === "BY_PRODUCT") {
  //   // Use item's tax percentage on item total after discount
  //   taxAmount = (itemTotalAfterDiscount * item.tax) / 100;
  // } else if (
  //   estimateTaxMode === "BY_TOTAL" &&
  //   item.vatEnabled &&
  //   estimateTaxPercentage
  // ) {
  //   // Use estimate tax percentage on items with vatEnabled = true
  //   taxAmount = (itemTotalAfterDiscount * estimateTaxPercentage) / 100;
  // }

  // 4. Final item total without tax so the tax is not added in the item but on the estimate level
  return itemTotalAfterDiscount;
}

/**
 * Create a new estimate with items
 */
export async function createEstimate(
  workspaceId: number,
  data: CreateEstimateDTO,
): Promise<EstimateResponse> {
  return await prisma.$transaction(async (tx) => {
    // Check if workspace has at least one business
    const businessCount = await tx.business.count({
      where: {
        workspaceId,
      },
    });

    if (businessCount === 0) {
      throw new EntityValidationError(
        "You must create a business before creating estimates. Please complete the setup first.",
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

    // Generate estimate number if not provided
    const estimateNumber = data.estimateNumber;
    // Check if estimate number already exists
    const existing = await tx.estimate.findUnique({
      where: {
        workspaceId_businessId_estimateNumber: {
          businessId: data.businessId,
          estimateNumber,
          workspaceId,
        },
      },
    });
    if (existing) {
      throw new FieldValidationError({
        fields: { estimateNumber: ["Estimate number already exists"] },
        message: "Estimate number already exists",
        statusCode: 400,
      });
    }

    // Create estimate items with calculations
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
              // For BY_TOTAL mode, set tax to estimate taxPercentage for display if vatEnabled
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

    // Calculate estimate totals
    const totals = calculateEstimateTotals(
      {
        discount: data.discount,
        discountType: data.discountType,
        taxMode: data.taxMode,
        taxPercentage: data.taxPercentage ?? null,
      },
      itemsToCreate,
    );

    // Get next sequence
    const lastEstimate = await tx.estimate.findFirst({
      orderBy: {
        sequence: "desc",
      },
      where: {
        workspaceId,
      },
    });
    const sequence = lastEstimate ? lastEstimate.sequence + 1 : 1;

    // Handle client creation or selection
    // let clientId: number;
    // let client: {
    //   address: null | string;
    //   email: string;
    //   id: number;
    //   phone: null | string;
    // };

    // if (data.createClient && data.clientData) {
    //   // Create new client within the transaction
    //   // Get next client sequence
    //   const lastClient = await tx.client.findFirst({
    //     orderBy: {
    //       sequence: "desc",
    //     },
    //     select: {
    //       sequence: true,
    //     },
    //     where: {
    //       workspaceId,
    //     },
    //   });
    //   const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

    //   // Create the client
    //   const newClient = await tx.client.create({
    //     data: {
    //       address: data.clientData.address,
    //       businessName: data.clientData.businessName,
    //       email: data.clientData.email,
    //       name: data.clientData.name,
    //       nit: data.clientData.nit,
    //       phone: data.clientData.phone,
    //       reminderAfterDueIntervalDays:
    //         data.clientData.reminderAfterDueIntervalDays,
    //       reminderBeforeDueIntervalDays:
    //         data.clientData.reminderBeforeDueIntervalDays,
    //       sequence: clientSequence,
    //       workspaceId,
    //     },
    //   });

    //   clientId = newClient.id;
    //   client = {
    //     address: newClient.address,
    //     email: newClient.email,
    //     id: newClient.id,
    //     phone: newClient.phone,
    //   };
    // }

    // else {
    // Use existing client
    if (!data.clientId) {
      throw new EntityValidationError("Client must be selected");
    }

    const existingClient = await tx.client.findUnique({
      where: { id: data.clientId },
    });

    if (!existingClient) {
      throw new EntityValidationError("Client not found");
    }

    const clientId = existingClient.id;
    const client = {
      address: existingClient.address,
      email: existingClient.email,
      id: existingClient.id,
      phone: existingClient.phone,
    };
    // }

    // Use provided estimate-specific fields or fallback to client defaults
    const clientEmail = client.email;
    const clientPhone = client.phone;
    const clientAddress = client.address;
    const selectedPaymentMethodId = await resolveSelectedPaymentMethodId(
      tx,
      workspaceId,
      data.selectedPaymentMethodId ?? null,
    );

    // Create estimate
    const estimate = await tx.estimate.create({
      data: {
        businessId: data.businessId,
        clientAddress,
        clientEmail,
        clientPhone,
        summary: data.summary,
        timelineStartDate: data.timelineStartDate,
        timelineEndDate: data.timelineEndDate,
        clientId: clientId,
        currency: data.currency,
        discount: data.discount,
        discountType: data.discountType,
        estimateNumber,
        items: {
          create: itemsToCreate,
        },
        notes: data.notes,
        purchaseOrder: data.purchaseOrder,
        selectedPaymentMethodId,
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
      ...estimate,
      signatureData: estimate.signatureData,
      business: {
        ...estimate.business,
        defaultTaxMode: estimate.business.defaultTaxMode,
        defaultTaxPercentage: estimate.business.defaultTaxPercentage
          ? Number(estimate.business.defaultTaxPercentage)
          : null,
      },
      discount: Number(estimate.discount),
      items: estimate.items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        total: Number(item.total),
        unitPrice: Number(item.unitPrice),
      })),
      sequence: estimate.sequence,
      subtotal: Number(estimate.subtotal),
      taxPercentage: estimate.taxPercentage
        ? Number(estimate.taxPercentage)
        : null,
      total: Number(estimate.total),
      totalTax: Number(estimate.totalTax),
    } as unknown as EstimateResponse;
  });
}

// ===== CORE INVOICE OPERATIONS =====

/**
 * Delete an estimate
 */
export async function deleteEstimate(
  workspaceId: number,
  id: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingEstimate = await tx.estimate.findUnique({
      where: { id },
    });

    if (existingEstimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (existingEstimate.status !== "DRAFT") {
      throw new EntityValidationError("Cannot delete a non-draft estimate");
    }

    await tx.estimate.delete({
      where: { id },
    });
  });
}

/**
 * Delete an estimate item
 */
export async function deleteEstimateItem(
  workspaceId: number,
  estimateId: number,
  itemId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify estimate exists and belongs to workspace
    const estimate = await tx.estimate.findUnique({
      where: { id: estimateId },
    });

    if (estimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (estimate.status !== "DRAFT") {
      throw new EntityValidationError(
        "Cannot delete item from a non-draft estimate",
      );
    }

    // Verify item exists
    const existingItem = await tx.estimateItem.findUnique({
      where: { id: itemId },
    });

    if (existingItem?.estimateId !== estimateId) {
      throw new EntityNotFoundError("Estimate item not found");
    }

    // Delete item
    await tx.estimateItem.delete({
      where: { id: itemId },
    });

    // Recalculate estimate totals
    const allItems = await tx.estimateItem.findMany({
      where: { estimateId },
    });

    const totals = calculateEstimateTotals(
      {
        discount: Number(estimate.discount),
        discountType: estimate.discountType,
        taxMode: estimate.taxMode,
        taxPercentage: estimate.taxPercentage
          ? Number(estimate.taxPercentage)
          : null,
      },
      toEstimateTotalsItems(allItems),
    );

    await tx.estimate.update({
      data: {
        subtotal: totals.subtotal,
        total: totals.total,
        totalTax: totals.totalTax,
      },
      where: { id: estimateId },
    });
  });
}

/**
 * Get estimate by ID with items and relations (same shape as getEstimateBySequence).
 * Used by the send-receipt queue worker to build the estimate PDF.
 */
export async function getEstimateById(
  workspaceId: number,
  estimateId: number,
): Promise<EstimateResponse> {
  const estimate = await prisma.estimate.findFirst({
    include: {
      business: true,
      client: true,
      items: { orderBy: { name: "asc" } },
    },
    where: {
      id: estimateId,
      workspaceId,
    },
  });

  if (!estimate) {
    throw new EntityNotFoundError("Estimate not found");
  }

  return {
    ...estimate,
    signatureData: estimate.signatureData,
    business: {
      ...estimate.business,
      defaultTaxMode: estimate.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: estimate.business.defaultTaxPercentage
        ? Number(estimate.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(estimate.discount),
    items: estimate.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    subtotal: Number(estimate.subtotal),
    taxPercentage: estimate.taxPercentage
      ? Number(estimate.taxPercentage)
      : null,
    total: Number(estimate.total),
    totalTax: Number(estimate.totalTax),
  };
}

/**
 * Get estimate by ID with items and payments
 */
export async function getEstimateBySequence(
  workspaceId: number,
  sequence: number,
): Promise<EstimateResponse> {
  const estimate = await prisma.estimate.findUnique({
    include: {
      business: true,
      client: true,
      items: {
        orderBy: { name: "asc" },
      },
    },
    where: {
      workspaceId_sequence: {
        sequence,
        workspaceId,
      },
    },
  });

  if (estimate?.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Estimate not found");
  }

  return {
    ...estimate,
    signatureData: estimate.signatureData,
    business: {
      ...estimate.business,
      defaultTaxMode: estimate.business.defaultTaxMode as
        | "BY_PRODUCT"
        | "BY_TOTAL"
        | "NONE"
        | null
        | undefined,
      defaultTaxPercentage: estimate.business.defaultTaxPercentage
        ? Number(estimate.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(estimate.discount),
    items: estimate.items.map((item) => ({
      ...item,
      discount: Number(item.discount),
      quantity: Number(item.quantity),
      tax: Number(item.tax),
      total: Number(item.total),
      unitPrice: Number(item.unitPrice),
    })),
    subtotal: Number(estimate.subtotal),
    taxPercentage: estimate.taxPercentage
      ? Number(estimate.taxPercentage)
      : null,
    total: Number(estimate.total),
    totalTax: Number(estimate.totalTax),
  };
}

/**
 * Get next estimate number for a workspace (standalone version)
 * This version can be used without a transaction
 */
export async function getNextEstimateNumberForWorkspace(
  workspaceId: number,
  businessId: number,
): Promise<string> {
  return await getNextEstimateNumberInternal(prisma, businessId, workspaceId);
}

/**
 * List all estimates for a workspace
 */
export async function listEstimates(
  workspaceId: number,
  query: ListEstimatesQuery,
): Promise<{
  estimates: EstimateResponse[];
  limit: number;
  page: number;
  stats: {
    outstanding: number;
    paidCount: number;
    pendingCount: number;
    revenue: number;
    total: number;
    totalEstimated: number;
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

  const where: Prisma.EstimateWhereInput = {
    workspaceId,

    ...(search && {
      OR: [
        { estimateNumber: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { businessName: { contains: search, mode: "insensitive" } } },
      ],
    }),
    // Only allowed statuses (DRAFT, SENT, PAID, OVERDUE); VIEWED excluded from filter
    ...(statusParam && { status: statusParam }),
    ...(clientId && { clientId }),
    ...(businessId && { businessId }),
  };

  // const wherePaid: Prisma.EstimateWhereInput = { ...where, status: "PAID" };
  // const whereOverdue: Prisma.EstimateWhereInput = {
  //   ...where,
  //   status: "OVERDUE",
  // };

  const [
    estimates,
    total,
    // paidCount,
    // pendingCount,
    // revenueAgg,
  ] = await Promise.all([
    prisma.estimate.findMany({
      include: {
        business: true,
        client: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.estimate.count({ where }),
    // prisma.estimate.count({ where: wherePaid }),
    // prisma.estimate.count({ where: whereOverdue }),

    // prisma.estimate.aggregate({ _sum: { total: true }, where }),
  ]);

  return {
    estimates: estimates.map((est) => {
      const { _count, ...estFields } = est;
      return {
        ...estFields,
        signatureData: estFields.signatureData,
        business: {
          ...estFields.business,
          defaultTaxMode: est.business.defaultTaxMode,
          defaultTaxPercentage: est.business.defaultTaxPercentage
            ? Number(est.business.defaultTaxPercentage)
            : null,
        },
        discount: Number(est.discount),
        itemCount: _count.items,
        subtotal: Number(est.subtotal),
        taxPercentage: est.taxPercentage ? Number(est.taxPercentage) : null,
        total: Number(est.total),
        totalTax: Number(est.totalTax),
      };
    }),
    limit,
    page,
    stats: {
      outstanding: 0,
      paidCount: 0,
      pendingCount: 0,
      revenue: 0,
      total,
      totalEstimated: 0,
    },
    total,
  };
}

/**
 * Mark an estimate as sent
 * Updates status to SENT and sets sentAt timestamp
 */
export async function markEstimateAsSent(
  workspaceId: number,
  estimateId: number,
): Promise<EstimateResponse> {
  const estimate = await prisma.estimate.findUnique({
    include: { _count: { select: { items: true } } },
    where: {
      id: estimateId,
    },
  });

  if (estimate?.workspaceId !== workspaceId) {
    throw new EntityNotFoundError("Estimate not found");
  }

  if (estimate._count.items === 0) {
    throw new EntityValidationError("Cannot send an estimate with no items");
  }

  // Idempotent: if already sent (SENT, VIEWED, or PAID), don't overwrite status—return current state
  if (["PAID", "SENT", "VIEWED"].includes(estimate.status) && estimate.sentAt) {
    const existing = await prisma.estimate.findUnique({
      include: { business: true, client: true },
      where: { id: estimateId },
    });
    if (!existing) throw new EntityNotFoundError("Estimate not found");
    return {
      ...existing,
      signatureData: existing.signatureData,
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

  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const updateData: Prisma.EstimateUpdateInput = {
    sentAt: now,
    status: "SENT",
  };

  // When requireSignature is enabled, (re)issue a signing token for this send.
  if (estimate.requireSignature) {
    updateData.signingToken = randomUUID();
    updateData.signingTokenExpiresAt = new Date(now.getTime() + thirtyDaysMs);
  } else {
    updateData.signingToken = null;
    updateData.signingTokenExpiresAt = null;
  }

  const updatedEstimate = await prisma.estimate.update({
    data: updateData,
    include: {
      business: true,
      client: true,
    },

    where: {
      id: estimateId,
    },
  });

  return {
    ...updatedEstimate,
    signatureData: updatedEstimate.signatureData,
    business: {
      ...updatedEstimate.business,
      defaultTaxMode: updatedEstimate.business.defaultTaxMode,
      defaultTaxPercentage: updatedEstimate.business.defaultTaxPercentage
        ? Number(updatedEstimate.business.defaultTaxPercentage)
        : null,
    },
    discount: Number(updatedEstimate.discount),
    subtotal: Number(updatedEstimate.subtotal),
    taxPercentage: updatedEstimate.taxPercentage
      ? Number(updatedEstimate.taxPercentage)
      : null,
    total: Number(updatedEstimate.total),
    totalTax: Number(updatedEstimate.totalTax),
  };
}

/**
 * Revert an estimate from SENT back to DRAFT (e.g. when send-estimate worker fails).
 * No-op if estimate is not SENT.
 */
export async function revertEstimateToDraft(
  workspaceId: number,
  estimateId: number,
): Promise<void> {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
  });

  if (estimate?.workspaceId !== workspaceId) {
    return;
  }

  if (estimate.status !== "SENT") {
    return;
  }

  await prisma.estimate.update({
    data: {
      sentAt: null,
      status: "DRAFT",
    },
    where: { id: estimateId },
  });
}

/**
 * Update an existing estimate
 */
export async function updateEstimate(
  workspaceId: number,
  id: number,
  data: UpdateEstimateDTO,
): Promise<EstimateResponse> {
  return await prisma.$transaction(async (tx) => {
    // Verify estimate exists and belongs to workspace
    const existingEstimate = await tx.estimate.findUnique({
      where: { id },
    });

    if (existingEstimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (
      existingEstimate.status !== "DRAFT" &&
      existingEstimate.status !== "REJECTED"
    ) {
      throw new EntityValidationError("Cannot update a sent estimate");
    }

    // If items are being updated, recalculate totals
    const {
      clientAddress,
      clientEmail,
      clientId,
      clientPhone,
      items: _items,
      selectedPaymentMethodId,
      ...estimateData
    } = data;
    const updateData: Prisma.EstimateUpdateInput = { ...estimateData };

    // Handle client creation or selection
    let newClientId: number | undefined;

    // if (data.createClient === true && data.clientData) {
    //   // Create new client within the transaction
    //   // Get next client sequence
    //   const lastClient = await tx.client.findFirst({
    //     orderBy: {
    //       sequence: "desc",
    //     },
    //     select: {
    //       sequence: true,
    //     },
    //     where: {
    //       workspaceId,
    //     },
    //   });
    //   const clientSequence = lastClient ? lastClient.sequence + 1 : 1;

    //   // Create the client
    //   const newClient = await tx.client.create({
    //     data: {
    //       address: data.clientData.address,
    //       businessName: data.clientData.businessName,
    //       email: data.clientData.email,
    //       name: data.clientData.name,
    //       nit: data.clientData.nit,
    //       phone: data.clientData.phone,
    //       reminderAfterDueIntervalDays:
    //         data.clientData.reminderAfterDueIntervalDays,
    //       reminderBeforeDueIntervalDays:
    //         data.clientData.reminderBeforeDueIntervalDays,
    //       sequence: clientSequence,
    //       workspaceId,
    //     },
    //   });

    //   newClientId = newClient.id;

    //   updateData.clientEmail = newClient.email;
    //   updateData.clientPhone = newClient.phone;
    //   updateData.clientAddress = newClient.address;
    // }

    // Handle estimate-specific client fields
    // If clientId is being changed, fetch new client for defaults
    if (clientId && clientId !== existingEstimate.clientId) {
      const newClient = await tx.client.findUnique({
        where: { id: clientId },
      });

      if (!newClient) {
        throw new EntityValidationError("Client not found");
      }

      // If estimate-specific fields not provided, use new client defaults
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

    if (selectedPaymentMethodId !== undefined) {
      updateData.selectedPaymentMethod = await getSelectedPaymentMethodRelationInput(
        tx,
        workspaceId,
        selectedPaymentMethodId,
      );
    }

    // Just update estimate fields, recalculate if tax/discount changed
    const taxModeChanged =
      data.taxMode !== undefined && data.taxMode !== existingEstimate.taxMode;
    const discountChanged =
      data.discount !== undefined || data.discountType !== undefined;
    const taxPercentageChanged = data.taxPercentage !== undefined;

    // If taxMode changed to NONE, clear tax data on all items
    if (taxModeChanged && data.taxMode === "NONE") {
      await tx.estimateItem.updateMany({
        data: { tax: 0, vatEnabled: false },
        where: { estimateId: id },
      });

      const estimateItems = await tx.estimateItem.findMany({
        where: { estimateId: id },
      });

      const itemsToUpdate = toEstimateTotalsItems(estimateItems);

      // Recalculate totals with cleared tax data
      const totalsAfterClear = calculateEstimateTotals(
        {
          discount: data.discount ?? Number(existingEstimate.discount),
          discountType: data.discountType ?? existingEstimate.discountType,
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
    const effectiveTaxMode = data.taxMode ?? existingEstimate.taxMode;
    const effectiveTaxPercentage =
      data.taxPercentage !== undefined
        ? data.taxPercentage
        : existingEstimate.taxPercentage
          ? Number(existingEstimate.taxPercentage)
          : null;
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      effectiveTaxPercentage !== null &&
      (taxModeChanged || taxPercentageChanged)
    ) {
      await tx.estimateItem.updateMany({
        data: {
          tax: effectiveTaxPercentage,
          vatEnabled: effectiveTaxPercentage !== 0,
        },
        where: {
          estimateId: id,
        },
      });
    }

    if (taxModeChanged || discountChanged || taxPercentageChanged) {
      const estimateItems = await tx.estimateItem.findMany({
        where: { estimateId: id },
      });

      const itemsToUpdate = toEstimateTotalsItems(estimateItems);

      const totals = calculateEstimateTotals(
        {
          discount: data.discount ?? Number(existingEstimate.discount),
          discountType: data.discountType ?? existingEstimate.discountType,
          taxMode: data.taxMode ?? existingEstimate.taxMode,
          taxPercentage:
            data.taxPercentage !== undefined
              ? data.taxPercentage
              : existingEstimate.taxPercentage
                ? Number(existingEstimate.taxPercentage)
                : null,
        },
        itemsToUpdate,
      );

      updateData.subtotal = totals.subtotal;
      updateData.totalTax = totals.totalTax;
      updateData.total = totals.total;
    }

    const updatedEstimate = await tx.estimate.update({
      data: {
        ...updateData,
        client: {
          connect: clientId ? { id: clientId } : undefined,
        },
      },
      include: {
        business: true,
        client: true,
        items: true,
      },
      where: { id, workspaceId },
    });

    return {
      ...updatedEstimate,
      signatureData: updatedEstimate.signatureData,
      business: {
        ...updatedEstimate.business,
        defaultTaxMode: updatedEstimate.business.defaultTaxMode,
        defaultTaxPercentage: updatedEstimate.business.defaultTaxPercentage
          ? Number(updatedEstimate.business.defaultTaxPercentage)
          : null,
      },
      discount: Number(updatedEstimate.discount),
      items: updatedEstimate.items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        quantity: Number(item.quantity),
        tax: Number(item.tax),
        total: Number(item.total),
        unitPrice: Number(item.unitPrice),
      })),
      subtotal: Number(updatedEstimate.subtotal),
      taxPercentage: updatedEstimate.taxPercentage
        ? Number(updatedEstimate.taxPercentage)
        : null,
      total: Number(updatedEstimate.total),
      totalTax: Number(updatedEstimate.totalTax),
    };
  });
}

/**
 * Update an estimate item
 */
export async function updateEstimateItem(
  workspaceId: number,
  estimateId: number,
  itemId: number,
  data: UpdateEstimateItemDTO,
): Promise<EstimateItemResponse> {
  return await prisma.$transaction(async (tx) => {
    // Verify estimate exists and belongs to workspace
    const estimate = await tx.estimate.findUnique({
      where: { id: estimateId },
    });

    if (estimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (estimate.status !== "DRAFT") {
      throw new EntityValidationError(
        "Cannot update item of a non-draft estimate",
      );
    }

    // Verify item exists
    const existingItem = await tx.estimateItem.findUnique({
      where: { id: itemId },
    });

    if (existingItem?.estimateId !== estimateId) {
      throw new EntityNotFoundError("Estimate item not found");
    }

    // Handle catalog integration if needed
    let itemCatalogId = existingItem.catalogId;

    // If catalogId is provided directly, use it (when updating from existing catalog)
    if (data.catalogId !== undefined) {
      if (data.catalogId === null) {
        // Explicitly remove catalog link
        itemCatalogId = null;
      } else {
        // Verify catalog exists and belongs to the estimate's business
        const catalog = await tx.catalog.findUnique({
          where: { id: data.catalogId },
        });

        if (!catalog) {
          throw new EntityNotFoundError("Catalog item not found");
        }

        if (catalog.businessId !== estimate.businessId) {
          throw new EntityValidationError(
            "Catalog item does not belong to the estimate's business",
          );
        }

        itemCatalogId = data.catalogId;
      }
    } else if (data.saveToCatalog && !itemCatalogId) {
      // Create new catalog entry or link to existing one by name
      itemCatalogId = await handleCatalogIntegration(
        tx,
        workspaceId,
        estimate.businessId,
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
    const updateData: Prisma.EstimateItemUpdateInput = {};

    // Determine effective taxMode - use passed taxMode or fallback to estimate's
    const effectiveTaxMode = passedTaxMode ?? estimate.taxMode;

    // Prepare estimate update data for tax-related fields
    const estimateUpdateData: {
      taxMode?: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
    } = {};

    // If taxMode was passed and differs from estimate, update the estimate
    if (passedTaxMode && passedTaxMode !== estimate.taxMode) {
      estimateUpdateData.taxMode = passedTaxMode;
    }

    // If taxMode is BY_TOTAL and taxName/taxPercentage are provided, update them
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (passedTaxName !== undefined || passedTaxPercentage !== undefined)
    ) {
      if (passedTaxName !== undefined) {
        estimateUpdateData.taxName = passedTaxName;
      }
      if (passedTaxPercentage !== undefined) {
        estimateUpdateData.taxPercentage = passedTaxPercentage;
      }
    }

    // Update estimate if there are tax-related changes (before calculating totals)
    if (Object.keys(estimateUpdateData).length > 0) {
      await tx.estimate.update({
        data: estimateUpdateData,
        where: { id: estimateId },
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
      // Use vatEnabled field, set tax to estimate taxPercentage for display if vatEnabled
      const shouldHaveTax =
        (itemData.vatEnabled ?? existingItem.vatEnabled) &&
        estimate.taxPercentage;
      updateData.tax = shouldHaveTax ? Number(estimate.taxPercentage) : 0;
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
      // Set tax to estimate taxPercentage for display if vatEnabled
      finalTax =
        finalVatEnabled && estimate.taxPercentage
          ? Number(estimate.taxPercentage)
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

    // Use updated taxPercentage if provided, otherwise use estimate's current value
    const effectiveTaxPercentage =
      passedTaxPercentage !== undefined
        ? passedTaxPercentage
        : estimate.taxPercentage
          ? Number(estimate.taxPercentage)
          : null;

    const itemTotal = calculateItemTotal(finalItem);

    updateData.total = itemTotal;

    // Update item
    const item = await tx.estimateItem.update({
      data: updateData,
      where: { id: itemId },
    });

    // Recalculate estimate totals
    const allItems = await tx.estimateItem.findMany({
      where: { estimateId },
    });

    const totals = calculateEstimateTotals(
      {
        discount: Number(estimate.discount),
        discountType: estimate.discountType,
        taxMode: effectiveTaxMode,
        taxPercentage: effectiveTaxPercentage,
      },
      toEstimateTotalsItems(allItems),
    );

    // Prepare final estimate update data
    const finalEstimateUpdateData: {
      subtotal: number;
      taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
      taxName?: null | string;
      taxPercentage?: null | number;
      total: number;
      totalTax: number;
    } = {
      subtotal: totals.subtotal,
      taxMode: effectiveTaxMode, // Update estimate taxMode if it changed
      total: totals.total,
      totalTax: totals.totalTax,
    };

    // Include taxName and taxPercentage if they were provided and taxMode is BY_TOTAL
    if (
      effectiveTaxMode === "BY_TOTAL" &&
      (passedTaxName !== undefined || passedTaxPercentage !== undefined)
    ) {
      if (passedTaxName !== undefined) {
        finalEstimateUpdateData.taxName = passedTaxName;
      }
      if (passedTaxPercentage !== undefined) {
        finalEstimateUpdateData.taxPercentage = passedTaxPercentage;
      }
    }

    await tx.estimate.update({
      data: finalEstimateUpdateData,
      where: { id: estimateId },
    });

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
 * Calculate estimate totals from items
 */
function calculateEstimateTotals(
  estimate: {
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

  // Apply estimate-level discount to subtotal (tax must be calculated after all discounts)
  let subtotalAfterDiscount = subtotal;
  if (estimate.discountType === "PERCENTAGE") {
    subtotalAfterDiscount = subtotal - (subtotal * estimate.discount) / 100;
  } else if (estimate.discountType === "FIXED") {
    subtotalAfterDiscount = subtotal - estimate.discount;
  }

  // Tax base = amount after all discounts; apply proportional discount ratio to taxable amounts
  let totalTax: number;
  if (subtotal === 0) {
    totalTax = 0;
  } else {
    const ratio = subtotalAfterDiscount / subtotal;
    if (estimate.taxMode === "BY_PRODUCT") {
      totalTax = items.reduce((sum, item, index) => {
        const itemTaxableAfterDiscount = (itemTotals[index] ?? 0) * ratio;
        return sum + (itemTaxableAfterDiscount * item.tax) / 100;
      }, 0);
    } else if (estimate.taxMode === "BY_TOTAL" && estimate.taxPercentage) {
      const taxableSubtotal = items.reduce(
        (sum, item, index) =>
          item.vatEnabled ? sum + (itemTotals[index] ?? 0) : sum,
        0,
      );
      const taxableAfterDiscount = taxableSubtotal * ratio;
      totalTax = (taxableAfterDiscount * estimate.taxPercentage) / 100;
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

function toEstimateTotalsItems(
  items: {
    discount: number | Prisma.Decimal;
    discountType: "FIXED" | "NONE" | "PERCENTAGE";
    quantity: number | Prisma.Decimal;
    tax: number | Prisma.Decimal;
    unitPrice: number | Prisma.Decimal;
    vatEnabled: boolean;
  }[],
): {
  discount: number;
  discountType: "FIXED" | "NONE" | "PERCENTAGE";
  quantity: number;
  tax: number;
  unitPrice: number;
  vatEnabled: boolean;
}[] {
  return items.map((item) => ({
    discount: Number(item.discount),
    discountType: item.discountType,
    quantity: Number(item.quantity),
    tax: Number(item.tax),
    unitPrice: Number(item.unitPrice),
    vatEnabled: item.vatEnabled,
  }));
}

/**
 * Extract numeric part from estimate number using regex
 * Returns the last sequence of digits found in the string
 */
function extractNumberFromEstimateNumber(
  estimateNumber: string,
): null | number {
  const matches = estimateNumber.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  const last = matches.at(-1);
  return last ? parseInt(last, 10) : null;
}

// ===== PAYMENT OPERATIONS =====

/**
 * Get next estimate number for a workspace
 * This version works with a transaction client (for use within transactions)
 */
async function getNextEstimateNumber(
  tx: Prisma.TransactionClient,
  businessId: number,
  workspaceId: number,
): Promise<string> {
  return await getNextEstimateNumberInternal(tx, businessId, workspaceId);
}

/**
 * Internal implementation of getNextEstimateNumber
 * Works with both Prisma client and transaction client
 */
async function getNextEstimateNumberInternal(
  client: Prisma.TransactionClient | typeof prisma,
  businessId: number,
  workspaceId: number,
): Promise<string> {
  // No prefix configured, find the last estimate and try to increment
  const lastEstimate = await client.estimate.findFirst({
    orderBy: {
      estimateNumber: "desc",
    },
    select: {
      estimateNumber: true,
    },
    where: {
      businessId,
      workspaceId,
    },
  });

  if (!lastEstimate) {
    // No estimates at all, use default
    return "EST-0001";
  }

  // Try to extract and increment the number from the last estimate
  const extractedNumber = extractNumberFromEstimateNumber(
    lastEstimate.estimateNumber,
  );

  if (extractedNumber !== null && !isNaN(extractedNumber)) {
    const nextNumber = extractedNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(4, "0");
    // Try to preserve the format by keeping the prefix part if it exists
    const prefixMatch = /^[^0-9]*/.exec(lastEstimate.estimateNumber);
    const preservedPrefix = prefixMatch ? prefixMatch[0] : "EST-";
    return `${preservedPrefix}${paddedNumber}`;
  } else {
    // Couldn't extract number, use default
    return "EST-0001";
  }
}

/**
 * Handle catalog integration for estimate item
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

async function getSelectedPaymentMethodRelationInput(
  tx: Prisma.TransactionClient,
  workspaceId: number,
  selectedPaymentMethodId: null | number,
): Promise<
  | { connect: { id: number } }
  | { disconnect: true }
> {
  const validatedPaymentMethodId = await resolveSelectedPaymentMethodId(
    tx,
    workspaceId,
    selectedPaymentMethodId,
  );

  if (validatedPaymentMethodId == null) {
    return { disconnect: true };
  }

  return { connect: { id: validatedPaymentMethodId } };
}
