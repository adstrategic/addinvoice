/**
 * Document preview: rasterized page images cached in Redis.
 * PDF send/download paths are unchanged — this is preview-only.
 */

import { createHash } from "node:crypto";

import { getCache } from "../../core/cache.js";
import { EntityNotFoundError } from "../../errors/EntityErrors.js";

export type DocumentPreviewKind =
  | "invoice"
  | "estimate"
  | "proposal"
  | "advance";

export interface PreviewPageMeta {
  page: number;
  width: number;
  height: number;
}

export interface PreviewMetadata {
  hash: string;
  pages: PreviewPageMeta[];
}

export interface PreviewPageResult {
  buffer: Buffer;
  hash: string;
  contentType: "image/webp";
}

interface RasterizedPageResponse {
  width: number;
  height: number;
  image: string;
}

const PREVIEW_TTL_SECONDS = 60 * 60; // 1 hour

const RENDER_PATHS: Record<DocumentPreviewKind, string> = {
  invoice: "/render-invoice-images",
  estimate: "/render-estimate-images",
  proposal: "/render-proposal-images",
  advance: "/render-advance-images",
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(",")}}`;
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function metaKey(
  kind: DocumentPreviewKind,
  workspaceId: string,
  sequence: number | string,
  hash: string,
): string {
  return `preview:${kind}:${workspaceId}:${String(sequence)}:${hash}:meta`;
}

function pageKey(
  kind: DocumentPreviewKind,
  workspaceId: string,
  sequence: number | string,
  hash: string,
  page: number,
): string {
  return `preview:${kind}:${workspaceId}:${String(sequence)}:${hash}:page:${String(page)}`;
}

async function renderPagesFromPdfService(
  kind: DocumentPreviewKind,
  payload: unknown,
): Promise<RasterizedPageResponse[]> {
  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }

  const response = await fetch(
    `${pdfServiceUrl.replace(/\/$/, "")}${RENDER_PATHS[kind]}`,
    {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "X-PDF-Service-Key": pdfServiceSecret,
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `PDF service preview render failed: ${String(response.status)} ${errText}`,
    );
  }

  const body = (await response.json()) as { pages?: RasterizedPageResponse[] };
  if (!Array.isArray(body.pages) || body.pages.length === 0) {
    throw new Error("PDF service returned no preview pages");
  }
  return body.pages;
}

async function cacheRenderedPages(args: {
  kind: DocumentPreviewKind;
  workspaceId: string;
  sequence: number | string;
  hash: string;
  pages: RasterizedPageResponse[];
}): Promise<PreviewMetadata> {
  const { kind, workspaceId, sequence, hash, pages } = args;
  const cache = getCache();
  const meta: PreviewMetadata = {
    hash,
    pages: pages.map((page, index) => ({
      page: index + 1,
      width: page.width,
      height: page.height,
    })),
  };

  await cache.set(
    metaKey(kind, workspaceId, sequence, hash),
    JSON.stringify(meta),
    "EX",
    PREVIEW_TTL_SECONDS,
  );

  await Promise.all(
    pages.map((page, index) =>
      cache.set(
        pageKey(kind, workspaceId, sequence, hash, index + 1),
        page.image,
        "EX",
        PREVIEW_TTL_SECONDS,
      ),
    ),
  );

  return meta;
}

async function ensurePreviewCached(args: {
  kind: DocumentPreviewKind;
  workspaceId: string;
  sequence: number | string;
  payload: unknown;
}): Promise<PreviewMetadata> {
  const { kind, workspaceId, sequence, payload } = args;
  const hash = hashPayload(payload);
  const cache = getCache();
  const cached = await cache.get(metaKey(kind, workspaceId, sequence, hash));
  if (cached) {
    return JSON.parse(cached) as PreviewMetadata;
  }

  const pages = await renderPagesFromPdfService(kind, payload);
  return cacheRenderedPages({ kind, workspaceId, sequence, hash, pages });
}

export async function getPreviewMetadata(args: {
  kind: DocumentPreviewKind;
  workspaceId: string;
  sequence: number | string;
  payload: unknown;
}): Promise<PreviewMetadata> {
  return ensurePreviewCached(args);
}

export async function getPreviewPage(args: {
  kind: DocumentPreviewKind;
  workspaceId: string;
  sequence: number | string;
  hash: string;
  page: number;
  payload: unknown;
}): Promise<PreviewPageResult> {
  const { kind, workspaceId, sequence, hash, page, payload } = args;
  if (!Number.isInteger(page) || page < 1) {
    throw new EntityNotFoundError("Preview page not found");
  }

  const expectedHash = hashPayload(payload);
  if (hash !== expectedHash) {
    // Stale hash — regenerate under current payload hash.
    const meta = await ensurePreviewCached({
      kind,
      workspaceId,
      sequence,
      payload,
    });
    if (page > meta.pages.length) {
      throw new EntityNotFoundError("Preview page not found");
    }
    const cache = getCache();
    const imageB64 = await cache.get(
      pageKey(kind, workspaceId, sequence, meta.hash, page),
    );
    if (!imageB64) {
      throw new EntityNotFoundError("Preview page not found");
    }
    return {
      buffer: Buffer.from(imageB64, "base64"),
      hash: meta.hash,
      contentType: "image/webp",
    };
  }

  const cache = getCache();
  let imageB64 = await cache.get(pageKey(kind, workspaceId, sequence, hash, page));

  if (!imageB64) {
    const meta = await ensurePreviewCached({
      kind,
      workspaceId,
      sequence,
      payload,
    });
    if (page > meta.pages.length) {
      throw new EntityNotFoundError("Preview page not found");
    }
    imageB64 = await cache.get(
      pageKey(kind, workspaceId, sequence, meta.hash, page),
    );
    if (!imageB64) {
      throw new EntityNotFoundError("Preview page not found");
    }
    return {
      buffer: Buffer.from(imageB64, "base64"),
      hash: meta.hash,
      contentType: "image/webp",
    };
  }

  // Validate page is in range via meta when available
  const metaRaw = await cache.get(metaKey(kind, workspaceId, sequence, hash));
  if (metaRaw) {
    const meta = JSON.parse(metaRaw) as PreviewMetadata;
    if (page > meta.pages.length) {
      throw new EntityNotFoundError("Preview page not found");
    }
  }

  return {
    buffer: Buffer.from(imageB64, "base64"),
    hash,
    contentType: "image/webp",
  };
}
