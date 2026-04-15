import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createInvoiceFromEstimateMock,
  prismaMock,
  sendInvoiceQueueAddMock,
} = vi.hoisted(() => ({
  createInvoiceFromEstimateMock: vi.fn(),
  prismaMock: {
    $transaction: vi.fn(),
  },
  sendInvoiceQueueAddMock: vi.fn(),
}));

vi.mock("@addinvoice/db", () => ({
  prisma: prismaMock,
}));

vi.mock("../../invoices/invoices.service.js", () => ({
  createInvoiceFromEstimate: createInvoiceFromEstimateMock,
}));

vi.mock("../../../queue/queues.js", () => ({
  sendInvoiceQueue: {
    add: sendInvoiceQueueAddMock,
  },
}));

import { convertEstimateToInvoice, createEstimate } from "../estimates.service.js";

describe("convertEstimateToInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks converted invoice as sent and enqueues email send (no auto-payment)", async () => {
    const tx = {
      estimate: {
        findUnique: vi.fn().mockResolvedValue({
          business: { name: "Acme Studio" },
          client: { email: "client@example.com" },
          clientEmail: "client@example.com",
          convertedToInvoiceId: null,
          id: 11,
          items: [{ id: 1 }],
          status: "ACCEPTED",
          total: 250,
          workspaceId: 1,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      workspacePaymentMethod: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99,
          isEnabled: true,
          type: "NEQUI",
          workspaceId: 1,
        }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    createInvoiceFromEstimateMock.mockResolvedValue({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
      total: 250,
    });
    sendInvoiceQueueAddMock.mockResolvedValue({});

    await convertEstimateToInvoice(1, 7);

    expect(sendInvoiceQueueAddMock).toHaveBeenCalledWith(
      "send-invoice",
      expect.objectContaining({
        email: "client@example.com",
        invoiceId: 22,
        sequence: 22,
        workspaceId: 1,
      }),
    );
  });

  it("still converts when client email is missing", async () => {
    const tx = {
      estimate: {
        findUnique: vi.fn().mockResolvedValue({
          business: { name: "Acme Studio" },
          client: { email: null },
          clientEmail: null,
          convertedToInvoiceId: null,
          id: 11,
          items: [{ id: 1 }],
          status: "ACCEPTED",
          total: 250,
          workspaceId: 1,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      workspacePaymentMethod: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99,
          isEnabled: true,
          type: "NEQUI",
          workspaceId: 1,
        }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    createInvoiceFromEstimateMock.mockResolvedValue({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
      total: 250,
    });

    await expect(convertEstimateToInvoice(1, 7)).resolves.toEqual({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
    });
    expect(sendInvoiceQueueAddMock).toHaveBeenCalled();
  });

  it("uses persisted estimate payment method when converting", async () => {
    const tx = {
      estimate: {
        findUnique: vi.fn().mockResolvedValue({
          business: { name: "Acme Studio" },
          client: { email: "client@example.com" },
          clientEmail: "client@example.com",
          convertedToInvoiceId: null,
          id: 11,
          items: [{ id: 1 }],
          selectedPaymentMethodId: 99,
          status: "ACCEPTED",
          total: 250,
          workspaceId: 1,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      workspacePaymentMethod: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99,
          isEnabled: true,
          type: "NEQUI",
          workspaceId: 1,
        }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    createInvoiceFromEstimateMock.mockResolvedValue({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
      total: 250,
    });
    sendInvoiceQueueAddMock.mockResolvedValue({});

    await convertEstimateToInvoice(1, 7);

    expect(createInvoiceFromEstimateMock).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      tx,
      99,
    );
  });
});

describe("createEstimate selected payment method resolution", () => {
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
      estimate: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({ sequence: 7 }),
        create: vi.fn().mockResolvedValue({
          id: 88,
          sequence: 8,
          workspaceId: 1,
          businessId: 20,
          clientId: 30,
          clientEmail: "client@example.com",
          clientPhone: null,
          clientAddress: null,
          estimateNumber: "EST-0008",
          currency: "USD",
          discount: 0,
          discountType: "NONE",
          selectedPaymentMethodId: 99,
          status: "DRAFT",
          subtotal: 0,
          taxMode: "NONE",
          taxName: null,
          taxPercentage: null,
          total: 0,
          totalTax: 0,
          notes: null,
          purchaseOrder: null,
          terms: null,
          signatureData: null,
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

  it("applies workspace default when selection is omitted", async () => {
    const tx = buildTransactionMocks();

    await createEstimate(1, {
      businessId: 20,
      clientId: 30,
      currency: "USD",
      discount: 0,
      discountType: "NONE",
      estimateNumber: "EST-0008",
      items: [],
      taxMode: "NONE",
    } as any);

    expect(tx.estimate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedPaymentMethodId: 99,
        }),
      }),
    );
  });

  it("keeps explicit selected payment method over workspace default", async () => {
    const tx = buildTransactionMocks();
    tx.workspacePaymentMethod.findUnique.mockResolvedValueOnce({
      id: 77,
      workspaceId: 1,
      type: "NEQUI",
      isEnabled: true,
    });

    await createEstimate(1, {
      businessId: 20,
      clientId: 30,
      currency: "USD",
      discount: 0,
      discountType: "NONE",
      estimateNumber: "EST-0008",
      items: [],
      selectedPaymentMethodId: 77,
      taxMode: "NONE",
    } as any);

    expect(tx.estimate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedPaymentMethodId: 77,
        }),
      }),
    );
  });
});
