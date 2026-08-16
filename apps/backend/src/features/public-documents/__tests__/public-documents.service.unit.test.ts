import type { Mock } from "vitest";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: { findFirst: vi.fn(), update: vi.fn() },
    estimate: { findFirst: vi.fn(), update: vi.fn() },
    proposal: { findFirst: vi.fn(), update: vi.fn() },
    advance: { findFirst: vi.fn(), update: vi.fn() },
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

interface UpdateCall {
  data: Record<string, unknown>;
  where: Record<string, unknown>;
}

/** First argument the update mock received, typed so assertions stay safe. */
function updateCallArg(fn: Mock): UpdateCall {
  const calls = fn.mock.calls as unknown[][];
  const call = calls[0];
  if (!call) throw new Error("expected update to have been called");
  return call[0] as UpdateCall;
}

describe("public-documents.service", () => {
  beforeEach(() => {
    // resetAllMocks, not clearAllMocks: clear wipes call history but leaves
    // mockResolvedValue in place, so a return value set in one test leaks into
    // the next. Each test below sets the rows it needs.
    vi.resetAllMocks();
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

      const call = updateCallArg(prismaMock.invoice.update);
      expect(call.where).toEqual({ id: 1 });
      expect(call.data).toMatchObject({ status: "VIEWED" });
      expect(call.data.viewedAt).toBeInstanceOf(Date);
    });

    it("updates estimate viewedAt when sent", async () => {
      prismaMock.estimate.findFirst.mockResolvedValue({
        id: 5,
        status: "SENT",
        viewedAt: null,
      });
      prismaMock.estimate.update.mockResolvedValue({});

      await markPublicDocumentViewed(
        "est-550e8400-e29b-41d4-a716-446655440000",
      );

      const call = updateCallArg(prismaMock.estimate.update);
      expect(call.where).toEqual({ id: 5 });
      expect(call.data).toMatchObject({ status: "VIEWED" });
      expect(call.data.viewedAt).toBeInstanceOf(Date);
      expect(prismaMock.invoice.update).not.toHaveBeenCalled();
    });

    it("updates advance viewedAt when issued", async () => {
      prismaMock.advance.findFirst.mockResolvedValue({
        id: 9,
        status: "ISSUED",
        viewedAt: null,
      });
      prismaMock.advance.update.mockResolvedValue({});

      await markPublicDocumentViewed(
        "adv-550e8400-e29b-41d4-a716-446655440000",
      );

      const call = updateCallArg(prismaMock.advance.update);
      expect(call.where).toEqual({ id: 9 });
      expect(call.data).toMatchObject({ status: "VIEWED" });
      expect(call.data.viewedAt).toBeInstanceOf(Date);
    });

    it("leaves an already-viewed document untouched", async () => {
      prismaMock.estimate.findFirst.mockResolvedValue({
        id: 5,
        status: "VIEWED",
        viewedAt: new Date("2026-01-05"),
      });

      await markPublicDocumentViewed(
        "est-550e8400-e29b-41d4-a716-446655440000",
      );

      // viewedAt records first view only; re-opening the link must not move it.
      expect(prismaMock.estimate.update).not.toHaveBeenCalled();
    });

    it("throws when the slug matches no document", async () => {
      prismaMock.estimate.findFirst.mockResolvedValue(null);

      await expect(
        markPublicDocumentViewed("est-550e8400-e29b-41d4-a716-446655440000"),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
