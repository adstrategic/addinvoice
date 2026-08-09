/**
 * HTTP helpers for document preview responses.
 */

import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";

import type { PreviewPageResult } from "../document-preview.js";
import { sendPreviewPage } from "../preview-http.js";

function createMockRes(ifNoneMatch?: string) {
  const headers: Record<string, string> = {};
  const res = {
    req: { headers: { "if-none-match": ifNoneMatch } },
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
    send: vi.fn(),
    _headers: headers,
  };
  return res as unknown as Response & {
    _headers: Record<string, string>;
    status: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };
}

describe("sendPreviewPage", () => {
  const page: PreviewPageResult = {
    buffer: Buffer.from("webp"),
    hash: "a".repeat(64),
    contentType: "image/webp",
  };

  it("sets image/webp, ETag, and immutable Cache-Control", () => {
    const res = createMockRes();
    sendPreviewPage(res, page, 1);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/webp");
    expect(res.setHeader).toHaveBeenCalledWith(
      "ETag",
      `"${page.hash}-1"`,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, max-age=3600, immutable",
    );
    expect(res.send).toHaveBeenCalledWith(page.buffer);
  });

  it("returns 304 when If-None-Match matches ETag", () => {
    const etag = `"${page.hash}-2"`;
    const res = createMockRes(etag);
    sendPreviewPage(res, page, 2);
    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});
