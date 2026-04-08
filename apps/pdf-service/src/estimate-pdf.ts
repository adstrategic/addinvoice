/**
 * Generates a PDF buffer from estimate HTML using Puppeteer.
 */

import puppeteer, { Browser } from "puppeteer";

import { buildEstimateHtml } from "./estimate-html.js";
import type { EstimatePdfPayload } from "./schema.js";
import { getBrowser } from "./invoice-pdf.js";

const PDF_TIMEOUT_MS = 30000;

export async function generateEstimatePdf(
  payload: EstimatePdfPayload,
): Promise<Buffer> {
  const html = buildEstimateHtml(payload);
  const browser: Browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      timeout: PDF_TIMEOUT_MS,
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { bottom: "0", left: "0", right: "0", top: "0" },
      printBackground: true,
      timeout: PDF_TIMEOUT_MS,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {
      /* noop */
    });
  }
}
