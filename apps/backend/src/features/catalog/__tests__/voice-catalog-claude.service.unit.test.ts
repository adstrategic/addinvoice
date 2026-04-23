import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, anthropicCreate } = vi.hoisted(() => ({
  anthropicCreate: vi.fn(),
  prismaMock: {
    business: { findFirst: vi.fn() },
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

import * as catalogService from "../catalog.service.js"
import { createCatalogFromVoiceTranscript } from "../voice-catalog-claude.service.js"

describe("voice-catalog-claude.service", () => {
  const validToolInput = {
    businessId: 1,
    description: "Monthly website management and updates",
    name: "Website Management",
    price: 250,
    quantityUnit: "UNITS",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
    prismaMock.business.findFirst.mockResolvedValue({
      id: 1,
      name: "Test Business",
    })
    vi.spyOn(catalogService, "createCatalog").mockResolvedValue({
      business: {} as never,
      businessId: 1,
      createdAt: new Date(),
      description: "Monthly website management and updates",
      id: 10,
      name: "Website Management",
      price: 250,
      quantityUnit: "UNITS",
      sequence: 7,
      updatedAt: new Date(),
      workspaceId: 99,
    })
  })

  it("returns anthropic_unconfigured when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY
    const result = await createCatalogFromVoiceTranscript(
      99,
      1,
      "create catalog item",
    )
    expect(result).toEqual({ error: "anthropic_unconfigured" })
  })

  it("returns creation_failed when business is not in workspace", async () => {
    prismaMock.business.findFirst.mockResolvedValue(null)
    const result = await createCatalogFromVoiceTranscript(
      99,
      1,
      "create catalog item",
    )
    expect(result).toEqual({
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    })
  })

  it("runs Claude tool loop and returns sequence when create_catalog succeeds", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_catalog",
            input: validToolInput,
            name: "create_catalog",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      })

    const result = await createCatalogFromVoiceTranscript(
      99,
      1,
      "Website management at 250 dollars",
    )

    expect(result).toEqual({ name: "Website Management", sequence: 7 })
    expect(catalogService.createCatalog).toHaveBeenCalledWith(
      99,
      expect.objectContaining({
        businessId: 1,
        name: "Website Management",
      }),
    )
  })

  it("overrides model businessId with fixed businessId", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_catalog",
            input: { ...validToolInput, businessId: 999 },
            name: "create_catalog",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      })

    await createCatalogFromVoiceTranscript(99, 1, "some service 250")

    expect(catalogService.createCatalog).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ businessId: 1 }),
    )
  })

  it("returns creation_failed when Claude never produces a successful create_catalog", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ text: "I cannot help.", type: "text" }],
      stop_reason: "end_turn",
    })

    const result = await createCatalogFromVoiceTranscript(
      99,
      1,
      "create item",
    )
    expect(result).toMatchObject({ error: "creation_failed" })
    expect(catalogService.createCatalog).not.toHaveBeenCalled()
  })
})
