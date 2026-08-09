/**
 * Rasterizes a PDF buffer into one WebP image per page.
 */

import { pdf } from "pdf-to-img";
import sharp from "sharp";

export interface RasterizeOptions {
  /** Render scale passed to pdf-to-img (default 2 for crisp display). */
  scale?: number;
  /** WebP quality 1–100 (default 80). */
  quality?: number;
}

export interface RasterizedPage {
  width: number;
  height: number;
  /** Base64-encoded WebP bytes (no data-URL prefix). */
  image: string;
}

const DEFAULT_SCALE = 2;
const DEFAULT_QUALITY = 80;

/**
 * Convert a PDF buffer into one WebP page image per PDF page.
 */
export async function rasterizePdfToImages(
  pdfBuffer: Buffer,
  options: RasterizeOptions = {},
): Promise<RasterizedPage[]> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const document = await pdf(pdfBuffer, { scale });
  const pages: RasterizedPage[] = [];

  for (let pageNumber = 1; pageNumber <= document.length; pageNumber++) {
    const pngBuffer = await document.getPage(pageNumber);
    const webp = await sharp(pngBuffer).webp({ quality }).toBuffer({
      resolveWithObject: true,
    });

    pages.push({
      width: webp.info.width,
      height: webp.info.height,
      image: webp.data.toString("base64"),
    });
  }

  return pages;
}
