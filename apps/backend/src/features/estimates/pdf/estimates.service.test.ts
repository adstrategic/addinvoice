import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntityValidationError } from "../../../errors/EntityErrors.js";

const {
  createInvoiceFromEstimateMock,
  markInvoiceAsSentMock,
  prismaMock,
  sendInvoiceQueueAddMock,
} = vi.hoisted(() => ({
  createInvoiceFromEstimateMock: vi.fn(),
  markInvoiceAsSentMock: vi.fn(),
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
  markInvoiceAsSent: markInvoiceAsSentMock,
}));

vi.mock("../../../queue/queues.js", () => ({
  sendInvoiceQueue: {
    add: sendInvoiceQueueAddMock,
  },
}));

import { convertEstimateToInvoice } from "../estimates.service.js";

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
    };
    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    createInvoiceFromEstimateMock.mockResolvedValue({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
      total: 250,
    });
    markInvoiceAsSentMock.mockResolvedValue({});
    sendInvoiceQueueAddMock.mockResolvedValue({});

    await convertEstimateToInvoice(1, 7);

    expect(markInvoiceAsSentMock).toHaveBeenCalledWith(1, 22);
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

  it("throws when converted estimate has no client email for invoice sending", async () => {
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
    };
    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx as any));
    createInvoiceFromEstimateMock.mockResolvedValue({
      id: 22,
      invoiceNumber: "INV-0022",
      sequence: 22,
      total: 250,
    });

    await expect(convertEstimateToInvoice(1, 7)).rejects.toBeInstanceOf(
      EntityValidationError,
    );
    expect(sendInvoiceQueueAddMock).not.toHaveBeenCalled();
  });
});
