import type { Browser } from "puppeteer";

import type { AdvancePdfPayload } from "./schema.js";

import { buildAdvanceHtml } from "./advance-html.js";
import { getBrowser } from "./invoice-pdf.js";

const PDF_TIMEOUT_MS = 30000;

export async function generateAdvancePdf(
  payload: AdvancePdfPayload,
): Promise<Buffer> {
  const html = buildAdvanceHtml(payload);
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
