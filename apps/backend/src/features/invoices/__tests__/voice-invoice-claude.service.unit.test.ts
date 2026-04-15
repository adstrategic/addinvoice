import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, anthropicCreate } = vi.hoisted(() => ({
  anthropicCreate: vi.fn(),
  prismaMock: {
    business: { findFirst: vi.fn() },
    client: { findFirst: vi.fn() },
  },
}));

vi.mock("@addinvoice/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@addinvoice/db")>();
  return {
    ...actual,
    prisma: prismaMock,
  };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: anthropicCreate };
  },
}));

import * as invoicesService from "../invoices.service.js";
import { createInvoiceFromVoiceTranscript } from "../voice-invoice-claude.service.js";

describe("voice-invoice-claude.service", () => {
  const validCreateInvoiceToolInput = {
    clientEmail: "voice@test.com",
    clientId: 99,
    createClient: false,
    currency: "USD",
    discount: 0,
    discountType: "NONE",
    dueDate: "2026-05-10",
    invoiceNumber: "VOICE-001",
    issueDate: "2026-04-10",
    items: [
      {
        description: "Consulting hours",
        name: "Consulting",
        quantity: 2,
        unitPrice: 150,
      },
    ],
    taxMode: "NONE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    prismaMock.business.findFirst.mockResolvedValue({
      id: 1,
      name: "Test Business",
    });
    prismaMock.client.findFirst.mockResolvedValue({
      email: "voice@test.com",
      id: 99,
      name: "Locked Client",
    });
    vi.spyOn(invoicesService, "getNextInvoiceNumberForWorkspace").mockResolvedValue(
      "VOICE-001",
    );
    vi.spyOn(invoicesService, "createInvoice").mockResolvedValue({
      id: 500,
      invoiceNumber: "VOICE-001",
      sequence: 42,
    } as Awaited<ReturnType<typeof invoicesService.createInvoice>>);
  });

  it("returns anthropic_unconfigured when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await createInvoiceFromVoiceTranscript(
      10,
      1,
      99,
      "make an invoice",
    );
    expect(result).toEqual({ error: "anthropic_unconfigured" });
  });

  it("returns creation_failed when business is not in workspace", async () => {
    prismaMock.business.findFirst.mockResolvedValue(null);
    const result = await createInvoiceFromVoiceTranscript(
      10,
      99,
      1,
      "invoice text",
    );
    expect(result).toEqual({
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    });
  });

  it("returns creation_failed when client is not in workspace", async () => {
    prismaMock.client.findFirst.mockResolvedValue(null);
    const result = await createInvoiceFromVoiceTranscript(
      10,
      1,
      999,
      "invoice text",
    );
    expect(result).toEqual({
      error: "creation_failed",
      message: "Client not found or does not belong to your workspace",
    });
  });

  it("runs Claude tool loop and returns sequence when create_invoice succeeds", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_inv",
            input: validCreateInvoiceToolInput,
            name: "create_invoice",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      });

    const result = await createInvoiceFromVoiceTranscript(
      10,
      1,
      99,
      "Two consulting hours at 150 dollars each",
    );

    expect(result).toEqual({
      invoiceNumber: "VOICE-001",
      sequence: 42,
    });

    expect(invoicesService.createInvoice).toHaveBeenCalledTimes(1);
    expect(invoicesService.createInvoice).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        businessId: 1,
        clientEmail: "voice@test.com",
        clientId: 99,
        createClient: false,
        invoiceNumber: "VOICE-001",
      }),
    );
  });

  it("overrides model client fields with locked client when they differ", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_inv",
            input: {
              ...validCreateInvoiceToolInput,
              clientEmail: "wrong@evil.com",
              clientId: 1,
              createClient: true,
            },
            name: "create_invoice",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      });

    await createInvoiceFromVoiceTranscript(10, 1, 99, "one item 100 dollars");

    expect(invoicesService.createInvoice).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        clientEmail: "voice@test.com",
        clientId: 99,
        createClient: false,
      }),
    );
  });

  it("returns creation_failed when Claude never produces a successful create_invoice", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ text: "I cannot help.", type: "text" }],
      stop_reason: "end_turn",
    });

    const result = await createInvoiceFromVoiceTranscript(10, 1, 99, "hello");
    expect(result).toMatchObject({ error: "creation_failed" });
    expect(invoicesService.createInvoice).not.toHaveBeenCalled();
  });
});
