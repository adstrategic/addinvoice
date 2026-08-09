import { beforeEach, describe, expect, it, vi } from "vitest";

const redisStore = new Map<string, string>();

const redisMock = {
  get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
  set: vi.fn(async (key: string, value: string, _mode?: string, _ttl?: number) => {
    redisStore.set(key, value);
    return "OK";
  }),
  del: vi.fn(async (...keys: string[]) => {
    for (const key of keys) redisStore.delete(key);
    return keys.length;
  }),
};

vi.mock("../../../core/cache.js", () => ({
  getCache: () => redisMock,
}));

import {
  getPreviewMetadata,
  getPreviewPage,
} from "../document-preview.js";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("document-preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisStore.clear();
    process.env.PDF_SERVICE_URL = "http://pdf-service:4001";
    process.env.PDF_SERVICE_SECRET = "test-secret";
  });

  const payload = {
    invoice: { invoiceNumber: "INV-1", currency: "USD" },
    items: [],
  };

  describe("getPreviewMetadata", () => {
    it("calls pdf-service on cache miss and stores pages", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          pages: [
            { width: 800, height: 1131, image: Buffer.from("page1").toString("base64") },
            { width: 800, height: 1131, image: Buffer.from("page2").toString("base64") },
          ],
        }),
      });

      const result = await getPreviewMetadata({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        payload,
      });

      expect(result.pages).toEqual([
        { page: 1, width: 800, height: 1131 },
        { page: 2, width: 800, height: 1131 },
      ]);
      expect(result.hash).toHaveLength(64);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://pdf-service:4001/render-invoice-images",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-PDF-Service-Key": "test-secret",
          }),
        }),
      );
    });

    it("returns cached metadata without calling pdf-service on cache hit", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          pages: [
            { width: 800, height: 1131, image: Buffer.from("page1").toString("base64") },
          ],
        }),
      });

      const first = await getPreviewMetadata({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        payload,
      });
      const second = await getPreviewMetadata({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        payload,
      });

      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPreviewPage", () => {
    it("returns cached webp bytes for a page", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          pages: [
            { width: 800, height: 1131, image: Buffer.from("webp-bytes").toString("base64") },
          ],
        }),
      });

      const meta = await getPreviewMetadata({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        payload,
      });

      const page = await getPreviewPage({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        hash: meta.hash,
        page: 1,
        payload,
      });

      expect(page.buffer.toString()).toBe("webp-bytes");
      expect(page.hash).toBe(meta.hash);
      expect(page.contentType).toBe("image/webp");
    });

    it("throws EntityNotFoundError for out-of-range page", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          pages: [
            { width: 800, height: 1131, image: Buffer.from("page1").toString("base64") },
          ],
        }),
      });

      const meta = await getPreviewMetadata({
        kind: "invoice",
        workspaceId: "ws_1",
        sequence: 1,
        payload,
      });

      const { EntityNotFoundError } = await import("../../../errors/EntityErrors.js");
      await expect(
        getPreviewPage({
          kind: "invoice",
          workspaceId: "ws_1",
          sequence: 1,
          hash: meta.hash,
          page: 99,
          payload,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
