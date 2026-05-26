import type { PublicDocumentSummary } from "@addinvoice/schemas";

import { type Client, prisma } from "@addinvoice/db";

import { EntityNotFoundError, GoneError } from "../../errors/EntityErrors.js";
import { parsePublicSlug } from "../../lib/public-slug.js";
import { toEstimateResponse } from "../estimates/estimates.mapper.js";
import { buildEstimatePdfPayload } from "../estimates/estimates.service.js";
import { toInvoiceEntityWithRelations } from "../invoices/invoices.mapper.js";
import { buildInvoicePdfPayload } from "../invoices/invoices.service.js";
import { toProposalResponse } from "../proposals/proposals.mapper.js";
import { buildProposalPdfPayload } from "../proposals/proposals.service.js";

const INVOICE_PUBLIC_STATUSES = new Set(["OVERDUE", "PAID", "SENT", "VIEWED"]);

function clientDisplayName(client: Client): string {
  return client.businessName ?? client.name;
}

function assertInvoicePublicAccess(status: string): void {
  if (status === "DRAFT") {
    throw new GoneError("This document is not available for public viewing");
  }
  if (!INVOICE_PUBLIC_STATUSES.has(status)) {
    throw new GoneError("This document is not available for public viewing");
  }
}

function assertEstimatePublicAccess(status: string): void {
  if (status === "DRAFT") {
    throw new GoneError("This document is not available for public viewing");
  }
}

function assertProposalPublicAccess(status: string): void {
  if (status === "DRAFT") {
    throw new GoneError("This document is not available for public viewing");
  }
}

export async function getPublicDocumentBySlug(
  slug: string,
): Promise<PublicDocumentSummary> {
  const parsed = parsePublicSlug(slug);
  if (!parsed) {
    throw new EntityNotFoundError("Document not found");
  }

  if (parsed.type === "invoice") {
    const invoice = await prisma.invoice.findFirst({
      where: { publicSlug: slug },
      include: { business: true, client: true },
    });
    if (!invoice) throw new EntityNotFoundError("Document not found");
    assertInvoicePublicAccess(invoice.status);

    return {
      type: "invoice",
      status: invoice.status as "OVERDUE" | "PAID" | "SENT" | "VIEWED",
      invoiceNumber: invoice.invoiceNumber,
      total: Number(invoice.total),
      balance: Number(invoice.balance),
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentLink: invoice.paymentLink,
      client: {
        name: clientDisplayName(invoice.client),
        email: invoice.clientEmail,
      },
      business: { name: invoice.business.name },
    };
  }

  if (parsed.type === "estimate") {
    const estimate = await prisma.estimate.findFirst({
      where: { publicSlug: slug },
      include: {
        business: true,
        client: true,
        items: true,
        descriptiveItems: true,
        proposal: { select: { sequence: true } },
      },
    });
    if (!estimate) throw new EntityNotFoundError("Document not found");
    assertEstimatePublicAccess(estimate.status);

    return {
      type: "estimate",
      status: estimate.status,
      estimateNumber: estimate.estimateNumber,
      total: Number(estimate.total),
      currency: estimate.currency,
      requireSignature: estimate.requireSignature,
      signingToken: estimate.signingToken,
      client: {
        name: clientDisplayName(estimate.client),
        email: estimate.clientEmail,
      },
      business: { name: estimate.business.name },
    };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { publicSlug: slug },
    include: {
      business: true,
      client: true,
      descriptiveItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!proposal) throw new EntityNotFoundError("Document not found");
  assertProposalPublicAccess(proposal.status);

  return {
    type: "proposal",
    status: proposal.status,
    proposalNumber: proposal.proposalNumber,
    total: Number(proposal.total),
    currency: proposal.currency,
    requireSignature: proposal.requireSignature,
    signingToken: proposal.signingToken,
    client: {
      name: clientDisplayName(proposal.client),
      email: proposal.clientEmail,
    },
    business: { name: proposal.business.name },
  };
}

export async function markPublicDocumentViewed(slug: string): Promise<void> {
  const parsed = parsePublicSlug(slug);
  if (!parsed) {
    throw new EntityNotFoundError("Document not found");
  }

  if (parsed.type !== "invoice") {
    return;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { publicSlug: slug },
    select: { id: true, status: true, viewedAt: true },
  });
  if (!invoice) throw new EntityNotFoundError("Document not found");
  assertInvoicePublicAccess(invoice.status);

  if (invoice.viewedAt || invoice.status === "PAID") {
    return;
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      viewedAt: new Date(),
      status: invoice.status === "SENT" ? "VIEWED" : invoice.status,
    },
  });
}

export interface PublicDocumentPdfResult {
  buffer: Buffer;
  filename: string;
}

export async function getPublicDocumentPdfBySlug(
  slug: string,
): Promise<PublicDocumentPdfResult> {
  const parsed = parsePublicSlug(slug);
  if (!parsed) {
    throw new EntityNotFoundError("Document not found");
  }

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }

  if (parsed.type === "invoice") {
    const invoice = await prisma.invoice.findFirst({
      where: { publicSlug: slug },
      include: {
        business: true,
        client: true,
        items: true,
        payments: true,
        selectedPaymentMethod: true,
      },
    });
    if (!invoice) throw new EntityNotFoundError("Document not found");
    assertInvoicePublicAccess(invoice.status);

    const entity = toInvoiceEntityWithRelations(invoice);
    const payload = buildInvoicePdfPayload(entity);
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-invoice`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-PDF-Service-Key": pdfServiceSecret,
        },
        method: "POST",
      },
    );
    if (!pdfResponse.ok) {
      throw new Error(`PDF service error: ${String(pdfResponse.status)}`);
    }
    return {
      buffer: Buffer.from(await pdfResponse.arrayBuffer()),
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
    };
  }

  if (parsed.type === "estimate") {
    const estimate = await prisma.estimate.findFirst({
      where: { publicSlug: slug },
      include: {
        business: true,
        client: true,
        items: true,
        descriptiveItems: true,
        proposal: { select: { sequence: true } },
      },
    });
    if (!estimate) throw new EntityNotFoundError("Document not found");
    assertEstimatePublicAccess(estimate.status);

    const estimateResponse = toEstimateResponse(estimate);
    const payload = buildEstimatePdfPayload(estimateResponse);
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-estimate`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-PDF-Service-Key": pdfServiceSecret,
        },
        method: "POST",
      },
    );
    if (!pdfResponse.ok) {
      throw new Error(`PDF service error: ${String(pdfResponse.status)}`);
    }
    return {
      buffer: Buffer.from(await pdfResponse.arrayBuffer()),
      filename: `estimate-${estimate.estimateNumber}.pdf`,
    };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { publicSlug: slug },
    include: {
      business: true,
      client: true,
      descriptiveItems: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!proposal) throw new EntityNotFoundError("Document not found");
  assertProposalPublicAccess(proposal.status);

  const proposalResponse = toProposalResponse(proposal);
  const payload = buildProposalPdfPayload(proposalResponse);
  const pdfResponse = await fetch(
    `${pdfServiceUrl.replace(/\/$/, "")}/generate-proposal`,
    {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "X-PDF-Service-Key": pdfServiceSecret,
      },
      method: "POST",
    },
  );
  if (!pdfResponse.ok) {
    throw new Error(`PDF service error: ${String(pdfResponse.status)}`);
  }
  return {
    buffer: Buffer.from(await pdfResponse.arrayBuffer()),
    filename: `proposal-${proposal.proposalNumber}.pdf`,
  };
}
