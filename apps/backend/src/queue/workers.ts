import { Worker } from "bullmq";
import { getWorkerConnectionOptions } from "./connection";
import type { SendInvoiceJobData, SendReceiptJobData } from "./queues";
import * as invoicesService from "../features/invoices/invoices.service";
import { sendEmailWithPdf } from "../lib/email";
import * as paymentsService from "../features/payments/payments.service";

const connection = getWorkerConnectionOptions();

const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();

async function fetchInvoicePdfFromService(
  payload: ReturnType<typeof invoicesService.buildInvoicePdfPayload>,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${res.status} ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function fetchReceiptPdfFromService(
  payload: invoicesService.ReceiptPdfPayload,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${res.status} ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export function startSendInvoiceWorker(): Worker<SendInvoiceJobData> {
  const worker = new Worker<SendInvoiceJobData>(
    "email-invoice",
    async (job) => {
      const { sequence, invoiceId, workspaceId, email, subject, message } =
        job.data;
      const invoice = await invoicesService.getInvoiceBySequence(
        workspaceId,
        sequence,
      );
      if (!invoice.client) {
        throw new Error("Invoice client data missing");
      }
      const payload = invoicesService.buildInvoicePdfPayload(invoice);
      const pdfBuffer = await fetchInvoicePdfFromService(payload);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find the invoice attached as a PDF.
          </p>
        </div>
      `;
      await sendEmailWithPdf({
        to: email,
        subject,
        html,
        pdfBuffer,
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
      });
    },
    { connection },
  );

  worker.on("failed", async (job, err) => {
    console.error(`[queue] send-invoice job ${job?.id} failed:`, err?.message);
  });

  return worker;
}

export function startSendReceiptWorker(): Worker<SendReceiptJobData> {
  const worker = new Worker<SendReceiptJobData>(
    "email-receipt",
    async (job) => {
      const { paymentId, invoiceId, workspaceId, email, subject, message } =
        job.data;
      const invoice = await invoicesService.getInvoiceById(
        workspaceId,
        invoiceId,
      );
      const payment = await paymentsService.getPaymentById(
        workspaceId,
        paymentId,
      );
      if (!payment) {
        throw new Error("Payment not found for receipt");
      }
      const toEmail = email ?? invoice.clientEmail;
      if (!toEmail) {
        throw new Error("No recipient email for receipt");
      }
      const receiptPayload = invoicesService.buildReceiptPdfPayload(
        invoice,
        payment,
      );
      const pdfBuffer = await fetchReceiptPdfFromService(receiptPayload);
      const defaultHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment receipt – Invoice ${invoice.invoiceNumber}</h2>
          <p style="margin: 20px 0; line-height: 1.6; color: #666;">
            This is a confirmation that we received your payment of ${payment.amount} ${invoice.currency} on ${new Date(payment.paidAt ?? Date.now()).toLocaleDateString()}.
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find your receipt attached.
          </p>
        </div>
      `;
      const html =
        message != null && message !== ""
          ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment receipt – Invoice ${invoice.invoiceNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find your receipt attached.
          </p>
        </div>
      `
          : defaultHtml;
      const emailSubject =
        subject?.trim() ?? `Payment receipt - Invoice ${invoice.invoiceNumber}`;

      await sendEmailWithPdf({
        to: toEmail,
        subject: emailSubject,
        html,
        pdfBuffer,
        filename: `receipt-${invoice.invoiceNumber}-${payment.id}.pdf`,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(`[queue] send-receipt job ${job?.id} failed:`, err?.message);
  });

  return worker;
}

export function startWorkers(): {
  invoiceWorker: Worker<SendInvoiceJobData>;
  receiptWorker: Worker<SendReceiptJobData>;
} {
  const invoiceWorker = startSendInvoiceWorker();
  const receiptWorker = startSendReceiptWorker();
  console.log("[queue] Workers started: email-invoice, email-receipt");
  return { invoiceWorker, receiptWorker };
}
