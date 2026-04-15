import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, anthropicCreate } = vi.hoisted(() => ({
  anthropicCreate: vi.fn(),
  prismaMock: {
    business: { findFirst: vi.fn() },
    client: { findFirst: vi.fn() },
  },
}))

vi.mock("@addinvoice/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@addinvoice/db")>()
  return {
    ...actual,
    prisma: prismaMock,
  }
})

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: anthropicCreate }
  },
}))

import * as estimatesService from "../estimates.service.js"
import { createEstimateFromVoiceTranscript } from "../voice-estimate-claude.service.js"

describe("voice-estimate-claude.service", () => {
  const validCreateEstimateToolInput = {
    clientEmail: "voice@test.com",
    clientId: 99,
    createClient: false,
    currency: "USD",
    discount: 0,
    discountType: "NONE",
    estimateNumber: "EST-0001",
    items: [
      {
        description: "Website maintenance",
        name: "Maintenance",
        quantity: 2,
        unitPrice: 150,
      },
    ],
    taxMode: "NONE",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
    prismaMock.business.findFirst.mockResolvedValue({
      id: 1,
      name: "Test Business",
    })
    prismaMock.client.findFirst.mockResolvedValue({
      email: "voice@test.com",
      id: 99,
      name: "Locked Client",
    })
    vi.spyOn(
      estimatesService,
      "getNextEstimateNumberForWorkspace",
    ).mockResolvedValue("EST-0001")
    vi.spyOn(estimatesService, "createEstimate").mockResolvedValue({
      estimateNumber: "EST-0001",
      id: 500,
      sequence: 42,
    } as Awaited<ReturnType<typeof estimatesService.createEstimate>>)
  })

  it("returns anthropic_unconfigured when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY
    const result = await createEstimateFromVoiceTranscript(
      10,
      1,
      99,
      "make an estimate",
    )
    expect(result).toEqual({ error: "anthropic_unconfigured" })
  })

  it("returns creation_failed when business is not in workspace", async () => {
    prismaMock.business.findFirst.mockResolvedValue(null)
    const result = await createEstimateFromVoiceTranscript(10, 99, 1, "estimate")
    expect(result).toEqual({
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    })
  })

  it("returns creation_failed when client is not in workspace", async () => {
    prismaMock.client.findFirst.mockResolvedValue(null)
    const result = await createEstimateFromVoiceTranscript(10, 1, 999, "estimate")
    expect(result).toEqual({
      error: "creation_failed",
      message: "Client not found or does not belong to your workspace",
    })
  })

  it("runs Claude tool loop and returns sequence when create_estimate succeeds", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_est",
            input: validCreateEstimateToolInput,
            name: "create_estimate",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      })

    const result = await createEstimateFromVoiceTranscript(
      10,
      1,
      99,
      "Two website maintenance sessions at 150",
    )

    expect(result).toEqual({
      estimateNumber: "EST-0001",
      sequence: 42,
    })

    expect(estimatesService.createEstimate).toHaveBeenCalledTimes(1)
    expect(estimatesService.createEstimate).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        businessId: 1,
        clientEmail: "voice@test.com",
        clientId: 99,
        createClient: false,
        estimateNumber: "EST-0001",
      }),
    )
  })

  it("overrides model client fields with locked client when they differ", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_est",
            input: {
              ...validCreateEstimateToolInput,
              clientEmail: "wrong@evil.com",
              clientId: 1,
              createClient: true,
            },
            name: "create_estimate",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      })

    await createEstimateFromVoiceTranscript(10, 1, 99, "one item 100 dollars")

    expect(estimatesService.createEstimate).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        clientEmail: "voice@test.com",
        clientId: 99,
        createClient: false,
      }),
    )
  })

  it("returns creation_failed when Claude never produces a successful create_estimate", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ text: "I cannot help.", type: "text" }],
      stop_reason: "end_turn",
    })

    const result = await createEstimateFromVoiceTranscript(10, 1, 99, "hello")
    expect(result).toMatchObject({ error: "creation_failed" })
    expect(estimatesService.createEstimate).not.toHaveBeenCalled()
  })
})
