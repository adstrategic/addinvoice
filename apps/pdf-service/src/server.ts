import "dotenv/config";
import express, { type Request, type Response } from "express";
import type { z } from "zod";

import { generateAdvancePdf } from "./advance-pdf.js";
import { generateEstimatePdf } from "./estimate-pdf.js";
import { generateInvoicePdf, generateInvoicePdfBatch } from "./invoice-pdf.js";
import { generateProposalPdf } from "./proposal-pdf.js";
import { generateReceiptPdf } from "./receipt-pdf.js";
import { rasterizePdfToImages } from "./rasterize-pdf.js";
import {
  advancePdfPayloadSchema,
  estimatePdfPayloadSchema,
  invoicePdfBatchSchema,
  type InvoicePdfPayload,
  invoicePdfPayloadSchema,
  proposalPdfPayloadSchema,
  receiptPdfPayloadSchema,
} from "./schema.js";
import { requirePdfServiceSecret } from "./validate-secret.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

type PdfGenerator<T> = (payload: T) => Promise<Buffer>;

function registerPdfRoute<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  generate: PdfGenerator<z.infer<TSchema>>,
  filename: (payload: z.infer<TSchema>) => string,
  errorLabel: string,
): void {
  app.post(path, requirePdfServiceSecret, async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    const payload = parsed.data;

    try {
      const pdfBuffer = await generate(payload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename(payload)}"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error(`${errorLabel} failed:`, err);
      res.status(500).json({
        error: `Failed to generate ${errorLabel}`,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
}

function registerImageRoute<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  generate: PdfGenerator<z.infer<TSchema>>,
  errorLabel: string,
): void {
  app.post(path, requirePdfServiceSecret, async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    const payload = parsed.data;

    try {
      const pdfBuffer = await generate(payload);
      const pages = await rasterizePdfToImages(pdfBuffer);
      res.json({ pages });
    } catch (err) {
      console.error(`${errorLabel} image render failed:`, err);
      res.status(500).json({
        error: `Failed to render ${errorLabel} images`,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
}

registerPdfRoute(
  "/generate-invoice",
  invoicePdfPayloadSchema,
  generateInvoicePdf,
  (payload) => `invoice-${payload.invoice.invoiceNumber}.pdf`,
  "PDF",
);

app.post(
  "/generate-batch",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = invoicePdfBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }
    const { payloads } = parsed.data as { payloads: InvoicePdfPayload[] };
    try {
      const pdfBuffers = await generateInvoicePdfBatch(payloads);
      const pdfsBase64 = pdfBuffers.map((b: Buffer) => b.toString("base64"));
      res.json({ pdfs: pdfsBase64 });
    } catch (err) {
      console.error("Batch PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDFs",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

registerPdfRoute(
  "/generate-estimate",
  estimatePdfPayloadSchema,
  generateEstimatePdf,
  (payload) => `estimate-${payload.invoice.invoiceNumber}.pdf`,
  "PDF",
);

registerPdfRoute(
  "/generate-proposal",
  proposalPdfPayloadSchema,
  generateProposalPdf,
  (payload) => `proposal-${payload.document.proposalNumber}.pdf`,
  "PDF",
);

registerPdfRoute(
  "/generate-advance",
  advancePdfPayloadSchema,
  generateAdvancePdf,
  (payload) => `advance-${String(payload.advance.sequence)}.pdf`,
  "PDF",
);

registerPdfRoute(
  "/generate-receipt",
  receiptPdfPayloadSchema,
  generateReceiptPdf,
  (payload) =>
    `receipt-${payload.invoice.invoiceNumber}-${payload.payment.id}.pdf`,
  "receipt PDF",
);

registerImageRoute(
  "/render-invoice-images",
  invoicePdfPayloadSchema,
  generateInvoicePdf,
  "invoice",
);

registerImageRoute(
  "/render-estimate-images",
  estimatePdfPayloadSchema,
  generateEstimatePdf,
  "estimate",
);

registerImageRoute(
  "/render-proposal-images",
  proposalPdfPayloadSchema,
  generateProposalPdf,
  "proposal",
);

registerImageRoute(
  "/render-advance-images",
  advancePdfPayloadSchema,
  generateAdvancePdf,
  "advance",
);

const portNum = Number(process.env.PORT);
const PORT = Number.isFinite(portNum) ? portNum : 4001;

app.listen(PORT, () => {
  console.log(`PDF service listening on port ${String(PORT)}`);
});
