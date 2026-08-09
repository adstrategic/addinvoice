import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  sendPreviewMetadata,
  sendPreviewPage,
} from "../_shared/preview-http.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";
import {
  publicDocumentPreviewPageParamsSchema,
  publicDocumentSlugParamsSchema,
} from "./public-documents.schemas.js";
import {
  getPublicDocumentBySlug,
  getPublicDocumentPdfBySlug,
  getPublicDocumentPreviewBySlug,
  getPublicDocumentPreviewPageBySlug,
  markPublicDocumentViewed,
} from "./public-documents.service.js";

export async function getPublicDocument(
  req: TypedRequest<typeof publicDocumentSlugParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { slug } = req.params;
  const data = await getPublicDocumentBySlug(slug);
  res.json({ data });
}

export async function getPublicDocumentPdf(
  req: TypedRequest<typeof publicDocumentSlugParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { slug } = req.params;
  const { buffer, filename } = await getPublicDocumentPdfBySlug(slug);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function getPublicDocumentPreview(
  req: TypedRequest<typeof publicDocumentSlugParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { slug } = req.params;
  const metadata = await getPublicDocumentPreviewBySlug(slug);
  sendPreviewMetadata(res, metadata);
}

export async function getPublicDocumentPreviewPage(
  req: TypedRequest<
    typeof publicDocumentPreviewPageParamsSchema,
    typeof previewHashQuerySchema,
    never
  >,
  res: Response,
): Promise<void> {
  const { slug, page } = req.params;
  const { hash } = req.query;
  const result = await getPublicDocumentPreviewPageBySlug(slug, page, hash);
  sendPreviewPage(res, result, page);
}

export async function markPublicDocumentViewedHandler(
  req: TypedRequest<typeof publicDocumentSlugParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { slug } = req.params;
  await markPublicDocumentViewed(slug);
  res.json({ message: "View recorded" });
}
