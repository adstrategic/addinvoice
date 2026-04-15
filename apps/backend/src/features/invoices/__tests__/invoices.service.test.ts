import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    business: { findFirst: vi.fn() },
    invoice: { create: vi.fn(), findFirst: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}));

vi.mock("@addinvoice/db", () => ({
  prisma: prismaMock,
}));

import { createInvoice, createInvoiceFromEstimate } from "../invoices.service.js";

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

describe("createInvoice selected payment method resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildTransactionMocks() {
    const tx = {
      business: {
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn().mockResolvedValue({ id: 20 }),
      },
      client: {
        findUnique: vi.fn().mockResolvedValue({
          id: 30,
          email: "client@example.com",
          phone: null,
          address: null,
        }),
      },
      invoice: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValueOnce({ sequence: 9 }),
        create: vi.fn().mockResolvedValue({
          id: 100,
          sequence: 10,
          workspaceId: 1,
          businessId: 20,
          clientId: 30,
          clientEmail: "client@example.com",
          clientPhone: null,
          clientAddress: null,
          currency: "USD",
          customHeader: null,
          discount: 0,
          discountType: "NONE",
          dueDate: new Date("2026-01-01"),
          invoiceNumber: "INV-0010",
          issueDate: new Date("2026-01-01"),
          notes: null,
          purchaseOrder: null,
          selectedPaymentMethodId: 99,
          status: "DRAFT",
          subtotal: 0,
          taxMode: "NONE",
          taxName: null,
          taxPercentage: null,
          terms: null,
          total: 0,
          totalTax: 0,
          balance: 0,
          business: {
            defaultTaxMode: "NONE",
            defaultTaxPercentage: null,
          },
          client: {},
          items: [],
        }),
      },
      workspace: {
        findUnique: vi.fn().mockResolvedValue({ defaultPaymentMethodId: 99 }),
      },
      workspacePaymentMethod: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99,
          workspaceId: 1,
          type: "PAYPAL",
          isEnabled: true,
        }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    return tx;
  }

  it("applies workspace default when create invoice omits selection", async () => {
    const tx = buildTransactionMocks();

    await createInvoice(1, {
      businessId: 20,
      clientId: 30,
      clientEmail: "client@example.com",
      createClient: false,
      currency: "USD",
      discount: 0,
      discountType: "NONE",
      dueDate: new Date("2026-01-01"),
      invoiceNumber: "INV-0010",
      issueDate: new Date("2026-01-01"),
      taxMode: "NONE",
      items: [],
    } as any);

    expect(tx.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedPaymentMethodId: 99,
        }),
      }),
    );
  });

  it("uses explicit selection instead of workspace default", async () => {
    const tx = buildTransactionMocks();
    tx.workspacePaymentMethod.findUnique.mockResolvedValueOnce({
      id: 77,
      workspaceId: 1,
      type: "NEQUI",
      isEnabled: true,
    });

    await createInvoice(1, {
      businessId: 20,
      clientId: 30,
      clientEmail: "client@example.com",
      createClient: false,
      currency: "USD",
      discount: 0,
      discountType: "NONE",
      dueDate: new Date("2026-01-01"),
      invoiceNumber: "INV-0010",
      issueDate: new Date("2026-01-01"),
      selectedPaymentMethodId: 77,
      taxMode: "NONE",
      items: [],
    } as any);

    expect(tx.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedPaymentMethodId: 77,
        }),
      }),
    );
  });
});
