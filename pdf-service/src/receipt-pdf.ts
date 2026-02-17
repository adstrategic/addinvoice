/**
 * Generates a PDF buffer from receipt HTML using Puppeteer.
 */

import { getBrowser } from "./invoice-pdf";
import { buildReceiptHtml } from "./receipt-html";
import type { ReceiptPdfPayload } from "./schema";

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
      waitUntil: "networkidle0",
      timeout: PDF_TIMEOUT_MS,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      timeout: PDF_TIMEOUT_MS,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
  }
}
