import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { publicDocumentSlugParamsSchema } from "./public-documents.schemas.js";
import {
  getPublicDocumentBySlug,
  getPublicDocumentPdfBySlug,
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

export async function markPublicDocumentViewedHandler(
  req: TypedRequest<typeof publicDocumentSlugParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { slug } = req.params;
  await markPublicDocumentViewed(slug);
  res.json({ message: "View recorded" });
}
