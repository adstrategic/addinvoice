import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    business: { findFirst: vi.fn() },
    invoice: { create: vi.fn(), findFirst: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}));

vi.mock("@addinvoice/db", () => ({
  prisma: prismaMock,
}));

import { createInvoiceFromEstimate } from "../invoices.service.js";

describe("createInvoiceFromEstimate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("copies estimate monetary fields and item pricing into the new invoice", async () => {
    prismaMock.business.findFirst.mockResolvedValue({ id: 20 });
    prismaMock.workspace.findUnique.mockResolvedValue({
      invoiceNumberPrefix: "INV-",
    });
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      invoiceNumber: "INV-0009",
    });
    prismaMock.invoice.findFirst.mockResolvedValueOnce({ sequence: 9 });
    prismaMock.invoice.create.mockResolvedValue({
      id: 100,
      invoiceNumber: "INV-0010",
      sequence: 10,
      workspaceId: 1,
      businessId: 20,
      clientId: 30,
      clientEmail: "client@example.com",
      currency: "USD",
      notes: "Estimate notes",
      terms: "Estimate terms",
      status: "DRAFT",
      issueDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-01"),
      discount: 25,
      discountType: "FIXED",
      subtotal: 400,
      totalTax: 44,
      total: 419,
      balance: 419,
      taxMode: "BY_TOTAL",
      taxName: "VAT",
      taxPercentage: 11,
      business: {
        defaultTaxMode: "BY_TOTAL",
        defaultTaxPercentage: 11,
      },
      client: {},
      items: [
        {
          discount: 10,
          quantity: 2,
          tax: 11,
          total: 190,
          unitPrice: 100,
        },
      ],
      payments: [],
    });

    const estimate = {
      businessId: 20,
      clientEmail: "client@example.com",
      clientId: 30,
      currency: "USD",
      discount: 25,
      discountType: "FIXED",
      items: [
        {
          catalogId: null,
          description: "Desc",
          discount: 10,
          discountType: "PERCENTAGE",
          name: "Design",
          quantity: 2,
          quantityUnit: "HOURS",
          tax: 11,
          total: 190,
          unitPrice: 100,
          vatEnabled: true,
        },
      ],
      notes: "Estimate notes",
      subtotal: 400,
      taxMode: "BY_TOTAL",
      taxName: "VAT",
      taxPercentage: 11,
      terms: "Estimate terms",
      total: 419,
      totalTax: 44,
    } as any;

    await createInvoiceFromEstimate(1, estimate);

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          balance: 419,
          discount: 25,
          discountType: "FIXED",
          subtotal: 400,
          taxMode: "BY_TOTAL",
          taxName: "VAT",
          taxPercentage: 11,
          total: 419,
          totalTax: 44,
        }),
      }),
    );

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              expect.objectContaining({
                discount: 10,
                discountType: "PERCENTAGE",
                quantity: 2,
                tax: 11,
                total: 190,
                unitPrice: 100,
                vatEnabled: true,
              }),
            ],
          },
        }),
      }),
    );
  });
});
