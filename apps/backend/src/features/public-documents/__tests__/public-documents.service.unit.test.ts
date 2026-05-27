import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: { findFirst: vi.fn(), update: vi.fn() },
    estimate: { findFirst: vi.fn() },
    proposal: { findFirst: vi.fn() },
    advance: { findFirst: vi.fn() },
  },
}));

vi.mock("@addinvoice/db", () => ({
  prisma: prismaMock,
}));

vi.mock("../../estimates/estimates.service.js", () => ({
  buildEstimatePdfPayload: vi.fn(),
}));
vi.mock("../../invoices/invoices.service.js", () => ({
  buildInvoicePdfPayload: vi.fn(),
}));
vi.mock("../../proposals/proposals.service.js", () => ({
  buildProposalPdfPayload: vi.fn(),
}));
vi.mock("../../estimates/estimates.mapper.js", () => ({
  toEstimateResponse: vi.fn(),
}));
vi.mock("../../invoices/invoices.mapper.js", () => ({
  toInvoiceEntityWithRelations: vi.fn(),
}));
vi.mock("../../proposals/proposals.mapper.js", () => ({
  toProposalResponse: vi.fn(),
}));

import {
  EntityNotFoundError,
  GoneError,
} from "../../../errors/EntityErrors.js";
import {
  getPublicDocumentBySlug,
  markPublicDocumentViewed,
} from "../public-documents.service.js";

const invoiceRow = {
  status: "SENT",
  invoiceNumber: "INV-001",
  total: 100,
  balance: 100,
  currency: "USD",
  issueDate: new Date("2026-01-01"),
  dueDate: new Date("2026-01-31"),
  paymentLink: "https://pay.example.com",
  clientEmail: "client@example.com",
  client: { name: "Jane Doe", businessName: null },
  business: { name: "Acme Co" },
};

describe("public-documents.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicDocumentBySlug", () => {
    it("returns invoice summary for valid inv slug", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(invoiceRow);

      const result = await getPublicDocumentBySlug(
        "inv-550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toMatchObject({
        type: "invoice",
        invoiceNumber: "INV-001",
        total: 100,
        client: { name: "Jane Doe", email: "client@example.com" },
        business: { name: "Acme Co" },
      });
    });

    it("throws GoneError for draft invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue({
        ...invoiceRow,
        status: "DRAFT",
      });

      await expect(
        getPublicDocumentBySlug("inv-550e8400-e29b-41d4-a716-446655440000"),
      ).rejects.toThrow(GoneError);
    });

    it("throws GoneError for voided invoice", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue({
        ...invoiceRow,
        status: "VOIDED",
      });

      await expect(
        getPublicDocumentBySlug("inv-550e8400-e29b-41d4-a716-446655440000"),
      ).rejects.toThrow(GoneError);
    });

    it("throws EntityNotFoundError for invalid slug prefix", async () => {
      await expect(getPublicDocumentBySlug("bad-slug")).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it("returns estimate summary for valid est slug", async () => {
      prismaMock.estimate.findFirst.mockResolvedValue({
        status: "SENT",
        estimateNumber: "EST-001",
        total: 250,
        currency: "USD",
        requireSignature: true,
        signingToken: "token-abc",
        clientEmail: "client@example.com",
        client: { name: "Jane", businessName: "Jane LLC" },
        business: { name: "Acme Co" },
      });

      const result = await getPublicDocumentBySlug(
        "est-550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toMatchObject({
        type: "estimate",
        estimateNumber: "EST-001",
        signingToken: "token-abc",
        client: { name: "Jane LLC" },
      });
    });

    it("returns advance summary for valid adv slug", async () => {
      prismaMock.advance.findFirst.mockResolvedValue({
        status: "ISSUED",
        sequence: 12,
        projectName: "Kitchen remodel",
        advanceDate: new Date("2026-02-01"),
        location: "123 Main St",
        client: { name: "Jane Doe", businessName: null, email: "jane@example.com" },
        business: { name: "Acme Co" },
      });

      const result = await getPublicDocumentBySlug(
        "adv-550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toMatchObject({
        type: "advance",
        sequence: 12,
        projectName: "Kitchen remodel",
        location: "123 Main St",
        client: { name: "Jane Doe", email: "jane@example.com" },
        business: { name: "Acme Co" },
      });
    });

    it("throws GoneError for draft advance", async () => {
      prismaMock.advance.findFirst.mockResolvedValue({
        status: "DRAFT",
        sequence: 1,
        projectName: "Draft project",
        advanceDate: new Date("2026-02-01"),
        location: null,
        client: { name: "Jane", businessName: null, email: "jane@example.com" },
        business: { name: "Acme Co" },
      });

      await expect(
        getPublicDocumentBySlug("adv-550e8400-e29b-41d4-a716-446655440000"),
      ).rejects.toThrow(GoneError);
    });
  });

  describe("markPublicDocumentViewed", () => {
    it("updates invoice viewedAt when sent", async () => {
      prismaMock.invoice.findFirst.mockResolvedValue({
        id: 1,
        status: "SENT",
        viewedAt: null,
      });
      prismaMock.invoice.update.mockResolvedValue({});

      await markPublicDocumentViewed(
        "inv-550e8400-e29b-41d4-a716-446655440000",
      );

      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "VIEWED",
          viewedAt: expect.any(Date),
        }),
      });
    });

    it("no-ops for estimate slug", async () => {
      await markPublicDocumentViewed(
        "est-550e8400-e29b-41d4-a716-446655440000",
      );
      expect(prismaMock.invoice.update).not.toHaveBeenCalled();
    });
  });
});
