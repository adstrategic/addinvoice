import type { Browser } from "puppeteer";

import type { ProposalPdfPayload } from "./schema.js";

import { getBrowser } from "./invoice-pdf.js";
import { buildProposalHtml } from "./proposal-html.js";

const PDF_TIMEOUT_MS = 30000;

export async function generateProposalPdf(
  payload: ProposalPdfPayload,
): Promise<Buffer> {
  const html = buildProposalHtml(payload);
  const browser: Browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      timeout: PDF_TIMEOUT_MS,
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { bottom: "60px", left: "0", right: "0", top: "20px" },
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
