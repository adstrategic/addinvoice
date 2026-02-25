/**
 * Generates a PDF buffer from receipt HTML using Puppeteer.
 */

import type { ReceiptPdfPayload } from "./schema.js";

import { getBrowser } from "./invoice-pdf.js";
import { buildReceiptHtml } from "./receipt-html.js";

const PDF_TIMEOUT_MS = 30000;

/**
 * Generate a PDF buffer from receipt payload.
 */
export async function generateReceiptPdf(
  payload: ReceiptPdfPayload,
): Promise<Buffer> {
  const html = buildReceiptHtml(payload);
  const browser = await getBrowser();
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
