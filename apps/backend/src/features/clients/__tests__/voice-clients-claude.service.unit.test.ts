import { beforeEach, describe, expect, it, vi } from "vitest";

const { anthropicCreate } = vi.hoisted(() => ({
  anthropicCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: anthropicCreate };
  },
}));

import * as clientsService from "../clients.service.js";
import { createClientFromVoiceTranscript } from "../voice-clients-claude.service.js";

describe("voice-clients-claude.service", () => {
  const validToolInput = {
    email: "acme@example.com",
    name: "Acme Corp",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.spyOn(clientsService, "createClient").mockResolvedValue({
      address: null,
      businessName: null,
      createdAt: new Date(),
      email: "acme@example.com",
      id: 42,
      name: "Acme Corp",
      nit: null,
      phone: null,
      reminderAfterDueIntervalDays: null,
      reminderBeforeDueIntervalDays: null,
      sequence: 5,
      updatedAt: new Date(),
      workspaceId: 99,
    });
  });

  it("returns anthropic_unconfigured when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await createClientFromVoiceTranscript(
      99,
      "add client Acme acme@example.com",
    );
    expect(result).toEqual({ error: "anthropic_unconfigured" });
  });

  it("runs Claude tool loop and returns sequence when create_client succeeds", async () => {
    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_client",
            input: validToolInput,
            name: "create_client",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      });

    const result = await createClientFromVoiceTranscript(
      99,
      "New client Acme Corporation email acme at example dot com",
    );

    expect(result).toEqual({ name: "Acme Corp", sequence: 5 });
    expect(clientsService.createClient).toHaveBeenCalledWith(
      99,
      expect.objectContaining({
        email: "acme@example.com",
        name: "Acme Corp",
      }),
    );
  });

  it("returns creation_failed when Claude never produces a successful create_client", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ text: "I cannot help.", type: "text" }],
      stop_reason: "end_turn",
    });

    const result = await createClientFromVoiceTranscript(
      99,
      "create client",
    );
    expect(result).toMatchObject({ error: "creation_failed" });
    expect(clientsService.createClient).not.toHaveBeenCalled();
  });

  it("returns creation_failed when createClient throws", async () => {
    vi.mocked(clientsService.createClient).mockRejectedValueOnce(
      new Error("database down"),
    );

    anthropicCreate
      .mockResolvedValueOnce({
        content: [
          {
            id: "toolu_create_client",
            input: validToolInput,
            name: "create_client",
            type: "tool_use",
          },
        ],
        stop_reason: "tool_use",
      })
      .mockResolvedValueOnce({
        content: [{ text: "Done.", type: "text" }],
        stop_reason: "end_turn",
      });

    const result = await createClientFromVoiceTranscript(
      99,
      "Acme acme@example.com",
    );

    expect(result).toMatchObject({ error: "creation_failed" });
  });
});
