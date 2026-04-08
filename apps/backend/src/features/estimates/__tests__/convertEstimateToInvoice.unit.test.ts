import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntityNotFoundError, EntityValidationError } from "../../../errors/EntityErrors.js";
import prismaMock from "../../../core/__mocks__/db.js";
import { convertEstimateToInvoice } from "../estimates.service.js";

vi.mock("@addinvoice/db", () =>
  import("../../../core/__mocks__/db.js").then((m) => ({
    prisma: m.default,
    EstimateStatus: {
      INVOICED: "INVOICED",
      DRAFT: "DRAFT",
      SENT: "SENT",
      ACCEPTED: "ACCEPTED",
      REJECTED: "REJECTED",
    },
    Prisma: {},
  })),
);

vi.mock("../../invoices/invoices.service.js", () => ({
  createInvoiceFromEstimate: vi.fn().mockResolvedValue({
    id: 100,
    sequence: 42,
    invoiceNumber: "INV-0042",
  }),
}));

const workspaceId = 1;
const sequence = 5;

const defaultEstimateRow = {
  id: 10,
  workspaceId: 1,
  clientId: 1,
  businessId: 1,
  clientEmail: "client@example.com",
  clientPhone: null as string | null,
  clientAddress: null as string | null,
  summary: null as string | null,
  timelineStartDate: null as Date | null,
  timelineEndDate: null as Date | null,
  sequence: 5,
  estimateNumber: "EST-0005",
  purchaseOrder: null as string | null,
  status: "ACCEPTED" as const,
  currency: "USD",
  subtotal: 100,
  totalTax: 0,
  discount: 0,
  discountType: "NONE" as const,
  taxMode: "NONE" as const,
  taxName: null as string | null,
  taxPercentage: null as number | null,
  total: 100,
  notes: null as string | null,
  terms: null as string | null,
  sentAt: null as Date | null,
  acceptedAt: null as Date | null,
  acceptedBy: null as string | null,
  signingToken: null as string | null,
  signingTokenExpiresAt: null as Date | null,
  signatureData: null as unknown,
  convertedToInvoiceId: null as number | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: {
    id: 1,
    workspaceId: 1,
    name: "Biz",
    nit: null,
    address: "Addr",
    email: "biz@example.com",
    phone: "123",
    logo: null,
    isDefault: true,
    sequence: 1,
    defaultTaxMode: null,
    defaultTaxName: null,
    defaultTaxPercentage: null,
    defaultNotes: null,
    defaultTerms: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  client: {
    id: 1,
    workspaceId: 1,
    name: "Client",
    email: "client@example.com",
    phone: null,
    address: null,
    nit: null,
    businessName: null,
    sequence: 1,
    reminderBeforeDueIntervalDays: null,
    reminderAfterDueIntervalDays: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  items: [] as { id: number; estimateId: number; name: string; description: string; quantity: number; quantityUnit: string; unitPrice: number; discount: number; discountType: string; tax: number; vatEnabled: boolean; total: number; catalogId: number | null; createdAt: Date; updatedAt: Date }[],
};

describe("estimates.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("convertEstimateToInvoice", () => {
    it("throws EntityNotFoundError when estimate is not found", async () => {
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      (prismaMock.estimate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toThrow(EntityNotFoundError);

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toMatchObject({ message: "Estimate not found" });
    });

    it("throws EntityNotFoundError when estimate belongs to another workspace", async () => {
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      (prismaMock.estimate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...defaultEstimateRow,
        workspaceId: 999,
      });

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it("throws EntityValidationError when estimate status is not ACCEPTED", async () => {
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      (prismaMock.estimate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...defaultEstimateRow,
        status: "DRAFT",
      });

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toThrow(EntityValidationError);

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toMatchObject({
        message: "Only accepted estimates can be converted to an invoice",
      });
    });

    it("throws EntityValidationError when estimate was already converted", async () => {
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      (prismaMock.estimate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...defaultEstimateRow,
        convertedToInvoiceId: 100,
      });

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toThrow(EntityValidationError);

      await expect(
        convertEstimateToInvoice(workspaceId, sequence),
      ).rejects.toMatchObject({
        message: "This estimate has already been converted to an invoice",
      });
    });

    it("returns created invoice and updates estimate when conversion succeeds", async () => {
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
      (prismaMock.estimate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        defaultEstimateRow,
      );
      (prismaMock.estimate.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await convertEstimateToInvoice(workspaceId, sequence);

      expect(result).toMatchObject({
        id: 100,
        sequence: 42,
        invoiceNumber: "INV-0042",
      });
      expect(prismaMock.estimate.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "INVOICED",
          convertedToInvoiceId: 100,
        }),
        where: { id: defaultEstimateRow.id },
      });
    });
  });
});
