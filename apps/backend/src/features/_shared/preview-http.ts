/**
 * HTTP helpers for document preview responses.
 */

import type { Response } from "express";

import type { PreviewMetadata, PreviewPageResult } from "./document-preview.js";

const PAGE_CACHE_SECONDS = 60 * 60;

export function sendPreviewMetadata(
  res: Response,
  metadata: PreviewMetadata,
): void {
  res.json({ data: metadata });
}

export function sendPreviewPage(
  res: Response,
  page: PreviewPageResult,
  pageNumber: number,
): void {
  const etag = `"${page.hash}-${String(pageNumber)}"`;
  res.setHeader("Content-Type", page.contentType);
  res.setHeader("ETag", etag);
  res.setHeader(
    "Cache-Control",
    `private, max-age=${String(PAGE_CACHE_SECONDS)}, immutable`,
  );

  const ifNoneMatch = res.req.headers["if-none-match"];
  if (ifNoneMatch === etag) {
    res.status(304).end();
    return;
  }

  res.send(page.buffer);
}
