import "dotenv/config";
import express, { type Request, type Response } from "express";

import { generateInvoicePdf, generateInvoicePdfBatch } from "./invoice-pdf.js";
import { generateReceiptPdf } from "./receipt-pdf.js";
import { generateEstimatePdf } from "./estimate-pdf.js";
import {
  estimatePdfPayloadSchema,
  invoicePdfBatchSchema,
  type InvoicePdfPayload,
  invoicePdfPayloadSchema,
  receiptPdfPayloadSchema,
} from "./schema.js";
import { requirePdfServiceSecret } from "./validate-secret.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post(
  "/generate-invoice",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = invoicePdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    const payload = parsed.data;

    try {
      const pdfBuffer = await generateInvoicePdf(payload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${payload.invoice.invoiceNumber}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
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

app.post(
  "/generate-estimate",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = estimatePdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }
    const payload = parsed.data;
    try {
      const pdfBuffer = await generateEstimatePdf(payload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="estimate-${payload.invoice.invoiceNumber}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Estimate PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

app.post(
  "/generate-receipt",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = receiptPdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    const payload = parsed.data;

    try {
      const pdfBuffer = await generateReceiptPdf(payload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="receipt-${payload.invoice.invoiceNumber}-${payload.payment.id}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Receipt PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate receipt PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

const portNum = Number(process.env.PORT);
const PORT = Number.isFinite(portNum) ? portNum : 4001;

app.listen(PORT, () => {
  console.log(`PDF service listening on port ${String(PORT)}`);
});
