/**
 * Generates a PDF buffer from invoice HTML using Puppeteer.
 */

import puppeteer, { Browser } from "puppeteer";
import { buildInvoiceHtml, type InvoicePdfPayload } from "./invoice-html";

const PDF_TIMEOUT_MS = 30000;
let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(executablePath && { executablePath }),
  });
  return browserInstance;
}

/**
 * Generate a PDF buffer from invoice payload (single).
 * Reuses shared browser via getBrowser().
 */
export async function generateInvoicePdf(
  payload: InvoicePdfPayload,
): Promise<Buffer> {
  const html = buildInvoiceHtml(payload);
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

/**
 * Generate PDFs for multiple invoice payloads in one browser session.
 * Returns array of PDF buffers in the same order as payloads.
 */
export async function generateInvoicePdfBatch(
  payloads: InvoicePdfPayload[],
): Promise<Buffer[]> {
  if (payloads.length === 0) return [];
  const browser = await getBrowser();
  const results: Buffer[] = [];
  for (const payload of payloads) {
    const html = buildInvoiceHtml(payload);
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
      results.push(Buffer.from(pdfBuffer));
    } finally {
      await page.close().catch(() => {});
    }
  }
  return results;
}
