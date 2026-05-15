import type { Prisma } from "@addinvoice/db";
import type {
  CreateProposalDescriptiveItemDTO,
  ProposalDashboardResponse,
  ProposalDescriptiveItemResponse,
  ProposalResponse,
  UpdateProposalDescriptiveItemDTO,
  UpdateProposalDTO,
} from "@addinvoice/schemas";

import { assertCanCreate, assertCanSendEmail, prisma } from "@addinvoice/db";
import { randomUUID } from "node:crypto";

import type { ListProposalsQuery } from "./proposals.schemas.js";

import { uploadEstimateSignatureFromDataUrl } from "../../core/cloudinary.js";
import { toJsonInput, toNullableJsonInput } from "../../core/prisma-json.js";
import {
  EntityNotFoundError,
  EntityValidationError,
  GoneError,
} from "../../errors/EntityErrors.js";
import { normalizeTipTapField } from "../../lib/tiptap.js";
import { sendInvoiceQueue, sendProposalQueue } from "../../queue/queues.js";
import {
  toProposalDashboardResponse,
  toProposalDescriptiveItemResponse,
  toProposalResponse,
} from "./proposals.mapper.js";

// ===== HELPER FUNCTIONS =====

/**
 * Extract numeric part from invoice number using regex.
 * Returns the last sequence of digits found in the string.
 */
function extractNumberFromInvoiceNumber(invoiceNumber: string): null | number {
  const matches = invoiceNumber.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  const last = matches.at(-1);
  return last ? parseInt(last, 10) : null;
}

/**
 * Get the next invoice number for a proposal conversion.
 * Follows the same logic as invoices.service.ts getNextInvoiceNumberInternal.
 */
async function getNextInvoiceNumberForProposal(
  tx: Prisma.TransactionClient,
  businessId: number,
  workspaceId: number,
): Promise<string> {
  const workspace = await tx.workspace.findUnique({
    select: { invoiceNumberPrefix: true },
    where: { id: workspaceId },
  });

  const prefix = workspace?.invoiceNumberPrefix ?? null;

  if (prefix) {
    const lastInvoiceWithPrefix = await tx.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
      where: {
        businessId,
        invoiceNumber: { startsWith: prefix },
        workspaceId,
      },
    });

    if (!lastInvoiceWithPrefix) {
      return `${prefix}0001`;
    }

    const extractedNumber = extractNumberFromInvoiceNumber(
      lastInvoiceWithPrefix.invoiceNumber,
    );

    if (extractedNumber !== null && !isNaN(extractedNumber)) {
      const nextNumber = extractedNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(4, "0");
      return `${prefix}${paddedNumber}`;
    } else {
      return `${prefix}0001`;
    }
  } else {
    const lastInvoice = await tx.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
      where: { businessId, workspaceId },
    });

    if (!lastInvoice) {
      return "INV-0001";
    }

    const extractedNumber = extractNumberFromInvoiceNumber(
      lastInvoice.invoiceNumber,
    );

    if (extractedNumber !== null && !isNaN(extractedNumber)) {
      const nextNumber = extractedNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(4, "0");
      const prefixMatch = /^[^0-9]*/.exec(lastInvoice.invoiceNumber);
      const preservedPrefix = prefixMatch ? prefixMatch[0] : "INV-";
      return `${preservedPrefix}${paddedNumber}`;
    } else {
      return "INV-0001";
    }
  }
}

// ===== CORE PROPOSAL OPERATIONS =====

/**
 * Convert an accepted estimate to a proposal.
 * Creates the proposal, copies descriptive items, updates estimate status,
 * and enqueues the proposal email.
 */
export async function convertEstimateToProposal(
  workspaceId: number,
  estimateSequence: number,
  emailData?: {
    email?: string;
    message?: string;
    requireSignature?: boolean;
    subject?: string;
  },
): Promise<ProposalResponse> {
  const proposal = await prisma.$transaction(async (tx) => {
    await assertCanCreate(tx, workspaceId, "proposals");
    const estimate = await tx.estimate.findUnique({
      where: {
        workspaceId_sequence: {
          workspaceId,
          sequence: estimateSequence,
        },
      },
      include: {
        proposal: true,
        descriptiveItems: true,
      },
    });

    if (estimate?.workspaceId !== workspaceId) {
      throw new EntityNotFoundError("Estimate not found");
    }

    if (estimate.status !== "ACCEPTED") {
      throw new EntityValidationError(
        "Only accepted estimates can be converted to a proposal",
      );
    }

    if (estimate.proposal) {
      throw new EntityValidationError(
        "This estimate is already linked to a proposal",
      );
    }

    const proposalNumber = "PROP-" + String(estimate.sequence).padStart(3, "0");

    const lastProposal = await tx.proposal.findFirst({
      orderBy: { sequence: "desc" },
      where: { workspaceId },
    });
    const sequence = lastProposal ? lastProposal.sequence + 1 : 1;

    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const requireSignature =
      emailData?.requireSignature ?? estimate.requireSignature ?? true;

    const signingToken = requireSignature ? randomUUID() : null;
    const signingTokenExpiresAt = requireSignature
      ? new Date(now.getTime() + thirtyDaysMs)
      : null;

    const created = await tx.proposal.create({
      data: {
        workspaceId,
        clientId: estimate.clientId,
        businessId: estimate.businessId,
        estimateId: estimate.id,
        clientEmail: estimate.clientEmail,
        clientPhone: estimate.clientPhone,
        clientAddress: estimate.clientAddress,
        purchaseOrder: estimate.purchaseOrder,
        currency: estimate.currency,
        total: estimate.total,
        notes: toNullableJsonInput(estimate.notes),
        terms: toNullableJsonInput(estimate.terms),
        exclusions: toNullableJsonInput(estimate.exclusions),
        summary: toNullableJsonInput(estimate.summary),
        timelineStartDate: estimate.timelineStartDate,
        timelineEndDate: estimate.timelineEndDate,
        requireSignature,
        selectedPaymentMethodId: estimate.selectedPaymentMethodId,
        proposalNumber,
        sequence,
        status: "SENT",
        sentAt: now,
        signingToken,
        signingTokenExpiresAt,
        descriptiveItems: {
          create: estimate.descriptiveItems.map((item) => ({
            title: item.title,
            description: toJsonInput(item.description),
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        business: true,
        client: true,
        descriptiveItems: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
    });

    await tx.estimate.update({
      data: { status: "PROPOSAL" },
      where: { id: estimate.id },
    });

    return created;
  });

  await assertCanSendEmail(prisma, workspaceId);
  await sendProposalQueue.add("send-proposal", {
    email: emailData?.email ?? proposal.clientEmail,
    proposalId: proposal.id,
    message:
      emailData?.message ??
      `Please find the attached proposal ${proposal.proposalNumber}.`,
    sequence: proposal.sequence,
    subject: emailData?.subject ?? `Proposal ${proposal.proposalNumber}`,
    workspaceId,
  });

  return toProposalResponse(proposal);
}

/**
 * Get a proposal by its sequence number.
 */
export async function getProposalBySequence(
  workspaceId: number,
  sequence: number,
): Promise<ProposalResponse> {
  const proposal = await prisma.proposal.findUnique({
    where: {
      workspaceId_sequence: {
        workspaceId,
        sequence,
      },
    },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!proposal) {
    throw new EntityNotFoundError("Proposal not found");
  }

  return toProposalResponse(proposal);
}

/**
 * Get a proposal by its ID.
 */
export async function getProposalById(
  workspaceId: number,
  proposalId: number,
): Promise<ProposalResponse> {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      workspaceId,
    },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!proposal) {
    throw new EntityNotFoundError("Proposal not found");
  }

  return toProposalResponse(proposal);
}

/**
 * List proposals for a workspace with optional filters and pagination.
 */
export async function listProposals(
  workspaceId: number,
  query: ListProposalsQuery,
): Promise<{
  limit: number;
  page: number;
  proposals: ProposalDashboardResponse[];
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

  const where: Prisma.ProposalWhereInput = {
    workspaceId,
    ...(statusParam && { status: statusParam }),
    ...(clientId && { clientId }),
    ...(businessId && { businessId }),
    ...(search && {
      OR: [
        { proposalNumber: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { businessName: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      include: {
        business: true,
        client: true,
        _count: { select: { descriptiveItems: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      where,
    }),
    prisma.proposal.count({ where }),
  ]);

  return {
    proposals: proposals.map(toProposalDashboardResponse),
    limit,
    page,
    total,
  };
}

/**
 * Update a proposal (only allowed after it has been rejected).
 */
export async function updateProposal(
  workspaceId: number,
  proposalId: number,
  data: UpdateProposalDTO,
): Promise<ProposalResponse> {
  const existing = await prisma.proposal.findFirst({
    where: { id: proposalId, workspaceId },
  });

  if (!existing) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (existing.status !== "REJECTED") {
    throw new EntityValidationError(
      "Proposals can only be edited after they have been rejected",
    );
  }

  const updated = await prisma.proposal.update({
    data: {
      ...(data.total !== undefined ? { total: data.total } : {}),
      ...(data.notes !== undefined
        ? { notes: toNullableJsonInput(data.notes) }
        : {}),
      ...(data.terms !== undefined
        ? { terms: toNullableJsonInput(data.terms) }
        : {}),
      ...(data.exclusions !== undefined
        ? { exclusions: toNullableJsonInput(data.exclusions) }
        : {}),
      ...(data.summary !== undefined
        ? { summary: toNullableJsonInput(data.summary) }
        : {}),
      ...(data.timelineStartDate !== undefined
        ? { timelineStartDate: data.timelineStartDate ?? null }
        : {}),
      ...(data.timelineEndDate !== undefined
        ? { timelineEndDate: data.timelineEndDate ?? null }
        : {}),
      ...(data.selectedPaymentMethodId !== undefined
        ? { selectedPaymentMethodId: data.selectedPaymentMethodId ?? null }
        : {}),
    },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    where: { id: proposalId },
  });

  return toProposalResponse(updated);
}

/**
 * Delete a proposal (restores the linked estimate to ACCEPTED status).
 */
export async function deleteProposal(
  workspaceId: number,
  proposalId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, workspaceId },
    });

    if (!proposal) {
      throw new EntityNotFoundError("Proposal not found");
    }

    if (proposal.status === "INVOICED") {
      throw new EntityValidationError(
        "Cannot delete a proposal that has been converted to an invoice",
      );
    }

    // Restore estimate back to ACCEPTED
    await tx.estimate.update({
      data: { status: "ACCEPTED" },
      where: { id: proposal.estimateId },
    });

    // Delete proposal (cascades to ProposalDescriptiveItem)
    await tx.proposal.delete({
      where: { id: proposalId },
    });
  });
}

/**
 * Resend a rejected proposal — resets status to SENT and issues a new signing token.
 */
export async function resendProposal(
  workspaceId: number,
  sequence: number,
): Promise<ProposalResponse> {
  const existing = await prisma.proposal.findUnique({
    where: { workspaceId_sequence: { workspaceId, sequence } },
  });

  if (!existing) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (existing.status !== "REJECTED") {
    throw new EntityValidationError("Only rejected proposals can be resent");
  }

  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const updated = await prisma.proposal.update({
    data: {
      status: "SENT",
      sentAt: now,
      rejectionReason: null,
      ...(existing.requireSignature
        ? {
            signingToken: randomUUID(),
            signingTokenExpiresAt: new Date(now.getTime() + thirtyDaysMs),
          }
        : {}),
    },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    where: { id: existing.id },
  });

  await assertCanSendEmail(prisma, workspaceId);
  await sendProposalQueue.add("send-proposal", {
    email: updated.clientEmail,
    proposalId: updated.id,
    message: `Please find the attached proposal ${updated.proposalNumber}.`,
    sequence: updated.sequence,
    subject: `Proposal ${updated.proposalNumber}`,
    workspaceId,
  });

  return toProposalResponse(updated);
}

/**
 * Mark a proposal as accepted (authenticated workspace action).
 */
export async function markProposalAsAccepted(
  workspaceId: number,
  proposalId: number,
): Promise<ProposalResponse> {
  const existing = await prisma.proposal.findFirst({
    where: { id: proposalId, workspaceId },
  });

  if (!existing) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (existing.status !== "SENT") {
    throw new EntityValidationError(
      "Only sent proposals can be marked as accepted",
    );
  }

  const updated = await prisma.proposal.update({
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedBy: "CLIENT",
    },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    where: { id: proposalId },
  });

  return toProposalResponse(updated);
}

/**
 * Public (no-auth) — get a proposal by its signing token.
 */
export async function getProposalBySigningToken(
  token: string,
): Promise<ProposalResponse> {
  const proposal = await prisma.proposal.findFirst({
    where: { signingToken: token },
    include: {
      business: true,
      client: true,
      descriptiveItems: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!proposal) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (
    proposal.signingTokenExpiresAt &&
    proposal.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (["ACCEPTED", "INVOICED", "REJECTED"].includes(proposal.status)) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  return toProposalResponse(proposal);
}

/**
 * Public (no-auth) — accept a proposal via its signing token.
 */
export async function acceptProposalByToken(
  token: string,
  body: { fullName: string; signatureData?: unknown },
): Promise<void> {
  const proposal = await prisma.proposal.findFirst({
    where: { signingToken: token },
  });

  if (!proposal) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (
    proposal.signingTokenExpiresAt &&
    proposal.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (proposal.status === "ACCEPTED") {
    throw new EntityValidationError("Proposal already accepted");
  }

  const rawSignatureData =
    body.signatureData && typeof body.signatureData === "object"
      ? (body.signatureData as Record<string, unknown>)
      : null;

  const rawSignatureImage =
    rawSignatureData && typeof rawSignatureData.signatureImage === "string"
      ? rawSignatureData.signatureImage
      : null;

  if (proposal.requireSignature) {
    if (!rawSignatureImage || rawSignatureImage.trim().length === 0) {
      throw new EntityValidationError("Signature image is required");
    }
  }

  let signatureImageUrl: string | undefined;
  if (rawSignatureImage && rawSignatureImage.trim().length > 0) {
    const uploadResult = await uploadEstimateSignatureFromDataUrl(
      rawSignatureImage,
      proposal.workspaceId,
      proposal.id,
    );
    signatureImageUrl = uploadResult.secure_url;
  }

  const finalSignatureData: Record<string, unknown> = {
    fullName: body.fullName.trim(),
    signedAt: new Date().toISOString(),
    ...(signatureImageUrl ? { signatureImageUrl } : {}),
  };

  await prisma.proposal.update({
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedBy: "END_CUSTOMER",
      signatureData: toNullableJsonInput(finalSignatureData),
      signingToken: null,
      signingTokenExpiresAt: null,
    },
    where: { id: proposal.id },
  });
}

/**
 * Public (no-auth) — reject a proposal via its signing token.
 */
export async function rejectProposalByToken(
  token: string,
  body: { rejectionReason?: string },
): Promise<void> {
  const proposal = await prisma.proposal.findFirst({
    where: { signingToken: token },
  });

  if (!proposal) {
    throw new EntityNotFoundError("Proposal not found");
  }

  if (
    proposal.signingTokenExpiresAt &&
    proposal.signingTokenExpiresAt < new Date()
  ) {
    throw new GoneError("This link has expired or is no longer valid");
  }

  if (proposal.status === "ACCEPTED") {
    throw new EntityValidationError("Proposal already accepted");
  }

  await prisma.proposal.update({
    data: {
      status: "REJECTED",
      rejectionReason: body.rejectionReason ?? null,
      signingToken: null,
      signingTokenExpiresAt: null,
    },
    where: { id: proposal.id },
  });
}

/**
 * Convert an accepted proposal to an invoice.
 */
export async function convertProposalToInvoice(
  workspaceId: number,
  sequence: number,
): Promise<{ id: number; invoiceNumber: string; sequence: number }> {
  const conversion = await prisma.$transaction(async (tx) => {
    await assertCanCreate(tx, workspaceId, "invoices");
    const proposal = await tx.proposal.findUnique({
      where: {
        workspaceId_sequence: {
          workspaceId,
          sequence,
        },
      },
      include: {
        business: true,
        client: true,
      },
    });

    if (!proposal) {
      throw new EntityNotFoundError("Proposal not found");
    }

    if (proposal.status !== "ACCEPTED") {
      throw new EntityValidationError(
        "Only accepted proposals can be converted to an invoice",
      );
    }

    const invoiceNumber = await getNextInvoiceNumberForProposal(
      tx,
      proposal.businessId,
      workspaceId,
    );

    const lastInvoice = await tx.invoice.findFirst({
      orderBy: { sequence: "desc" },
      where: { workspaceId },
    });
    const invoiceSequence = lastInvoice ? lastInvoice.sequence + 1 : 1;

    const invoice = await tx.invoice.create({
      data: {
        workspaceId,
        businessId: proposal.businessId,
        clientId: proposal.clientId,
        clientEmail: proposal.clientEmail,
        currency: proposal.currency,
        notes: toNullableJsonInput(proposal.notes),
        terms: toNullableJsonInput(proposal.terms),
        status: "SENT",
        issueDate: new Date(),
        dueDate: new Date(),
        invoiceNumber,
        sequence: invoiceSequence,
        subtotal: proposal.total,
        total: proposal.total,
        balance: proposal.total,
        totalTax: 0,
        discount: 0,
        discountType: "NONE",
        taxMode: "NONE",
        selectedPaymentMethodId: proposal.selectedPaymentMethodId,
        items: {
          create: [
            {
              name: "Project Total",
              description: toJsonInput(
                normalizeTipTapField(
                  `Total amount for accepted proposal ${proposal.proposalNumber}.`,
                ),
              ),
              quantity: 1,
              quantityUnit: "UNITS",
              unitPrice: proposal.total,
              discount: 0,
              discountType: "NONE",
              tax: 0,
              vatEnabled: false,
              total: proposal.total,
            },
          ],
        },
      },
    });

    await tx.proposal.update({
      data: {
        convertedToInvoiceId: invoice.id,
        status: "INVOICED",
      },
      where: { id: proposal.id },
    });

    return {
      clientEmail: proposal.clientEmail,
      businessName: proposal.business.name,
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sequence: invoice.sequence,
    };
  });

  await sendInvoiceQueue.add("send-invoice", {
    email: conversion.clientEmail,
    invoiceId: conversion.id,
    message: `Your accepted proposal has been converted to an invoice. Please find the invoice ${conversion.invoiceNumber} attached.`,
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
 * Build the payload expected by the PDF service /generate-proposal endpoint.
 */
export function buildProposalPdfPayload(proposal: ProposalResponse): {
  client: {
    address: null | string;
    businessName: null | string;
    email: null | string;
    logo: null | string;
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
  descriptiveItems: {
    description: null | Record<string, unknown>;
    title: string;
  }[];
  document: {
    currency: string;
    exclusions: null | Record<string, unknown>;
    notes: null | Record<string, unknown>;
    proposalNumber: string;
    signature: null | {
      fullName: string;
      signatureImageUrl?: string;
      signedAt: string;
    };
    summary: null | Record<string, unknown>;
    terms: null | Record<string, unknown>;
    timelineEndDate: Date | null | string;
    timelineStartDate: Date | null | string;
    total: number;
  };
} {
  return {
    client: {
      address: proposal.client.address ?? null,
      businessName: proposal.client.businessName ?? null,
      email: proposal.client.email,
      logo: proposal.client.logo ?? null,
      name: proposal.client.name,
      nit: proposal.client.nit ?? null,
      phone: proposal.client.phone ?? null,
    },
    company: {
      address: proposal.business.address,
      email: proposal.business.email,
      logo: proposal.business.logo ?? null,
      name: proposal.business.name,
      nit: proposal.business.nit ?? null,
      phone: proposal.business.phone,
    },
    document: {
      currency: proposal.currency,
      exclusions: proposal.exclusions ?? null,
      notes: proposal.notes ?? null,
      proposalNumber: proposal.proposalNumber,
      signature: extractSignature(proposal.signatureData),
      summary: proposal.summary ?? null,
      terms: proposal.terms ?? null,
      timelineEndDate: proposal.timelineEndDate ?? null,
      timelineStartDate: proposal.timelineStartDate ?? null,
      total: proposal.total,
    },
    descriptiveItems: (proposal.descriptiveItems ?? []).map((item) => ({
      description: item.description,
      title: item.title,
    })),
  };
}

function extractSignature(
  raw: unknown,
): null | { fullName: string; signatureImageUrl?: string; signedAt: string } {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.fullName !== "string" || typeof data.signedAt !== "string")
    return null;
  return {
    fullName: data.fullName,
    signedAt: data.signedAt,
    ...(typeof data.signatureImageUrl === "string"
      ? { signatureImageUrl: data.signatureImageUrl }
      : {}),
  };
}

// ===== DESCRIPTIVE ITEM CRUD =====

/**
 * Add a descriptive item to a proposal (only allowed when status is REJECTED).
 */
export async function addProposalDescriptiveItem(
  workspaceId: number,
  proposalId: number,
  data: CreateProposalDescriptiveItemDTO,
): Promise<ProposalDescriptiveItemResponse> {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, workspaceId },
    });

    if (!proposal) {
      throw new EntityNotFoundError("Proposal not found");
    }

    if (proposal.status !== "REJECTED") {
      throw new EntityValidationError(
        "Proposal descriptive items can only be modified after the proposal has been rejected",
      );
    }

    const existingCount = await tx.proposalDescriptiveItem.count({
      where: { proposalId },
    });

    const created = await tx.proposalDescriptiveItem.create({
      data: {
        proposalId,
        title: data.title,
        description: toJsonInput(data.description),
        sortOrder: existingCount,
      },
    });

    return toProposalDescriptiveItemResponse(created);
  });
}

/**
 * Update a descriptive item on a proposal (only allowed when status is REJECTED).
 */
export async function updateProposalDescriptiveItem(
  workspaceId: number,
  proposalId: number,
  itemId: number,
  data: UpdateProposalDescriptiveItemDTO,
): Promise<ProposalDescriptiveItemResponse> {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, workspaceId },
    });

    if (!proposal) {
      throw new EntityNotFoundError("Proposal not found");
    }

    if (proposal.status !== "REJECTED") {
      throw new EntityValidationError(
        "Proposal descriptive items can only be modified after the proposal has been rejected",
      );
    }

    const existing = await tx.proposalDescriptiveItem.findUnique({
      where: { id: itemId },
    });

    if (existing?.proposalId !== proposalId) {
      throw new EntityNotFoundError("Proposal descriptive item not found");
    }

    const { description, ...rest } = data;
    const updateData: Prisma.ProposalDescriptiveItemUpdateInput = {
      ...rest,
      ...(description !== undefined
        ? { description: toJsonInput(description) }
        : {}),
    };

    const updated = await tx.proposalDescriptiveItem.update({
      data: updateData,
      where: { id: itemId },
    });

    return toProposalDescriptiveItemResponse(updated);
  });
}

/**
 * Delete a descriptive item from a proposal (only allowed when status is REJECTED).
 * Re-numbers remaining items' sortOrder after deletion.
 */
export async function deleteProposalDescriptiveItem(
  workspaceId: number,
  proposalId: number,
  itemId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, workspaceId },
    });

    if (!proposal) {
      throw new EntityNotFoundError("Proposal not found");
    }

    if (proposal.status !== "REJECTED") {
      throw new EntityValidationError(
        "Proposal descriptive items can only be modified after the proposal has been rejected",
      );
    }

    const existing = await tx.proposalDescriptiveItem.findUnique({
      where: { id: itemId },
    });

    if (existing?.proposalId !== proposalId) {
      throw new EntityNotFoundError("Proposal descriptive item not found");
    }

    await tx.proposalDescriptiveItem.delete({
      where: { id: itemId },
    });

    const remainingItems = await tx.proposalDescriptiveItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      where: { proposalId },
    });

    await Promise.all(
      remainingItems.map((item, index) =>
        tx.proposalDescriptiveItem.update({
          data: { sortOrder: index },
          where: { id: item.id },
        }),
      ),
    );
  });
}
