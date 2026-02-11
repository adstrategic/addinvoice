/**
 * Generates a PDF buffer from invoice HTML using Puppeteer.
 */

import puppeteer, { Browser } from "puppeteer";
import { buildInvoiceHtml, type InvoicePdfPayload } from "./invoice-html";

const PDF_TIMEOUT_MS = 30000;
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
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
 * Generate a PDF buffer from invoice payload.
 */
export async function generateInvoicePdf(
  payload: InvoicePdfPayload
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
