/**
 * Generates a PDF buffer from invoice HTML using Puppeteer.
 */

import puppeteer, { Browser } from "puppeteer";

import { buildInvoiceHtml, type InvoicePdfPayload } from "./invoice-html.js";

const PDF_TIMEOUT_MS = 30000;
let browserInstance: Browser | null = null;

/**
 * Generate a PDF buffer from invoice payload (single).
 * Reuses shared browser via getBrowser().
 */
export async function generateInvoicePdf(
  payload: InvoicePdfPayload,
): Promise<Buffer> {
  const html = buildInvoiceHtml(payload);
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

/**
 * Generate PDFs for multiple invoice payloads in one browser session.
 * Returns array of PDF buffers in the same order as payloads.
 */
export async function generateInvoicePdfBatch(
  payloads: InvoicePdfPayload[],
): Promise<Buffer[]> {
  if (payloads.length === 0) return [];
  const browser: Browser = await getBrowser();
  const results: Buffer[] = [];
  for (const payload of payloads) {
    const html = buildInvoiceHtml(payload);
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
      results.push(Buffer.from(pdfBuffer));
    } finally {
      await page.close().catch(() => {
        /* noop */
      });
    }
  }
  return results;
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) {
    return browserInstance;
  }
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined;
  browserInstance = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
    ...(executablePath && { executablePath }),
  });
  return browserInstance;
}
