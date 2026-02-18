import "dotenv/config";
import express, { Request, Response } from "express";
import { requirePdfServiceSecret } from "./validate-secret";
import {
  invoicePdfPayloadSchema,
  invoicePdfBatchSchema,
  receiptPdfPayloadSchema,
  type InvoicePdfPayload,
  type ReceiptPdfPayload,
} from "./schema";
import { generateInvoicePdf, generateInvoicePdfBatch } from "./invoice-pdf";
import { generateReceiptPdf } from "./receipt-pdf";

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
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const payload: InvoicePdfPayload = parsed.data;

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
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }
    const { payloads } = parsed.data;
    try {
      const pdfBuffers = await generateInvoicePdfBatch(payloads);
      const pdfsBase64 = pdfBuffers.map((b) => b.toString("base64"));
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
  "/generate-receipt",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = receiptPdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const payload: ReceiptPdfPayload = parsed.data;

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

const PORT = Number(process.env.PORT) || 4001;

app.listen(PORT, () => {
  console.log(`PDF service listening on port ${PORT}`);
});
