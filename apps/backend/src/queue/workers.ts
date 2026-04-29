import { Worker } from "bullmq";
import { PaymentMethodType, prisma } from "@addinvoice/db";

import type {
  SendAdvanceJobData,
  SendEstimateJobData,
  SendInvoiceJobData,
  SendReceiptJobData,
} from "./queues.js";

import * as advancesService from "../features/advances/advances.service.js";
import * as estimatesService from "../features/estimates/estimates.service.js";
import * as invoicesService from "../features/invoices/invoices.service.js";
import * as paymentsService from "../features/payments/payments.service.js";
import {
  createCheckoutSession,
  createPerWorkspaceStripeClient,
} from "../features/stripe/stripe-integration.service.js";
import { sendEmailWithPdf } from "../lib/email.js";
import { getWorkerConnectionOptions } from "./connection.js";

const connection = getWorkerConnectionOptions();

const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();

export function startSendInvoiceWorker(): Worker<SendInvoiceJobData> {
  const worker = new Worker<SendInvoiceJobData>(
    "email-invoice",
    async (job) => {
      const { email, message, sequence, subject, workspaceId } = job.data;
      const invoice = await invoicesService.getInvoiceBySequence(
        workspaceId,
        sequence,
      );

      // If Stripe is selected as payment method, create a Checkout Session
      let paymentLink: string | null = null;
      if (invoice.selectedPaymentMethod?.type === "STRIPE") {
        const pm = await prisma.workspacePaymentMethod.findFirst({
          where: { type: PaymentMethodType.STRIPE, workspaceId },
        });

        if (pm?.stripeSecretKey) {
          const frontendUrl =
            process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
          const successUrl = `${frontendUrl}/invoices/${invoice.sequence}?paid=true`;
          const cancelUrl = `${frontendUrl}/invoices/${invoice.sequence}`;
          const stripeClient = createPerWorkspaceStripeClient(
            pm.stripeSecretKey,
          );
          paymentLink = await createCheckoutSession(
            stripeClient,
            invoice,
            successUrl,
            cancelUrl,
          );

          await prisma.invoice.update({
            data: { paymentLink, paymentProvider: "stripe" },
            where: { id: invoice.id },
          });
        }
      }

      const payload = invoicesService.buildInvoicePdfPayload(invoice);
      const pdfBuffer = await fetchInvoicePdfFromService(payload);

      const paymentButton = paymentLink
        ? `
          <div style="text-align:center; margin:24px 0;">
            <a href="${paymentLink}"
               style="background:#635BFF;color:#ffffff;padding:12px 24px;
                      border-radius:6px;text-decoration:none;font-weight:bold;
                      font-family:Arial,sans-serif;display:inline-block;">
              Pay Now with Stripe
            </a>
          </div>`
        : "";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          ${paymentButton}
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find the invoice attached as a PDF.
          </p>
        </div>
      `;
      await sendEmailWithPdf({
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        html,
        pdfBuffer,
        subject,
        to: email,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] send-invoice job ${String(job?.id)} failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

export function startSendEstimateWorker(): Worker<SendEstimateJobData> {
  const worker = new Worker<SendEstimateJobData>(
    "email-estimate",
    async (job) => {
      const { email, estimateId, message, subject, workspaceId } = job.data;
      const estimate = await estimatesService.getEstimateById(
        workspaceId,
        estimateId,
      );
      const toEmail = email;
      const estimatePayload =
        estimatesService.buildEstimatePdfPayload(estimate);
      const pdfBuffer = await fetchEstimatePdfFromService(estimatePayload);
      const frontendUrl =
        process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
      const signingLink =
        estimate.requireSignature && estimate.signingToken
          ? `<p style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
            <strong>Accept and sign this estimate:</strong><br/>
            <a href="${frontendUrl}/estimate/accept/${estimate.signingToken}" style="color: #2563eb; word-break: break-all;">
              ${frontendUrl}/estimate/accept/${estimate.signingToken}
            </a>
          </p>`
          : "";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Estimate ${estimate.estimateNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          ${signingLink}
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find the estimate attached as a PDF.
          </p>
        </div>
      `;
      const emailSubject = subject.trim();
      await sendEmailWithPdf({
        filename: `estimate-${estimate.estimateNumber}.pdf`,
        html,
        pdfBuffer,
        subject: emailSubject,
        to: toEmail,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] send-estimate job ${String(job?.id)} failed:`,
      err.message,
    );
  });
  return worker;
}

export function startSendAdvanceWorker(): Worker<SendAdvanceJobData> {
  const worker = new Worker<SendAdvanceJobData>(
    "email-advance",
    async (job) => {
      const { advanceId, email, message, subject, workspaceId } = job.data;
      const advance = await advancesService.getAdvanceById(workspaceId, advanceId);
      const payload = advancesService.buildAdvancePdfPayload(advance);
      const pdfBuffer = await fetchAdvancePdfFromService(payload);

      const attachmentFiles = await Promise.all(
        (advance.attachments ?? []).map(async (attachment, index) => {
          try {
            const response = await fetch(attachment.url);
            if (!response.ok) {
              return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const mimeType =
              attachment.mimeType?.trim() || response.headers.get("content-type") || "image/jpeg";
            const extension = mimeType.includes("png")
              ? "png"
              : mimeType.includes("webp")
                ? "webp"
                : "jpg";

            return {
              content: Buffer.from(arrayBuffer),
              filename:
                attachment.fileName?.trim() || `advance-photo-${String(index + 1)}.${extension}`,
            };
          } catch (error) {
            console.error("[queue] Failed to fetch advance attachment:", error);
            return null;
          }
        }),
      );

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Work advance - ${advance.projectName}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          <h3 style="color: #333; margin-top: 20px;">Work Completed</h3>
          <p style="line-height: 1.6; color: #666;">
            ${(advance.workCompleted ?? "No work notes provided.").replace(/\n/g, "<br/>")}
          </p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            Attached files include the PDF report and site images.
          </p>
        </div>
      `;

      await sendEmailWithPdf({
        filename: `advance-${String(advance.sequence)}.pdf`,
        html,
        pdfBuffer,
        subject: subject.trim(),
        to: email,
        attachments: attachmentFiles.filter((item): item is { content: Buffer; filename: string } => item != null),
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] send-advance job ${String(job?.id)} failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

export function startSendReceiptWorker(): Worker<SendReceiptJobData> {
  const worker = new Worker<SendReceiptJobData>(
    "email-receipt",
    async (job) => {
      const { email, invoiceId, message, paymentId, subject, workspaceId } =
        job.data;
      const invoice = await invoicesService.getInvoiceById(
        workspaceId,
        invoiceId,
      );
      const payment = await paymentsService.getPaymentById(
        workspaceId,
        paymentId,
      );
      const toEmail = email;
      const receiptPayload = invoicesService.buildReceiptPdfPayload(
        invoice,
        payment,
      );
      const pdfBuffer = await fetchReceiptPdfFromService(receiptPayload);
      const defaultHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment receipt – Invoice ${invoice.invoiceNumber}</h2>
          <p style="margin: 20px 0; line-height: 1.6; color: #666;">
            This is a confirmation that we received your payment of ${String(payment.amount)} ${invoice.currency} on ${new Date(payment.paidAt ?? Date.now()).toLocaleDateString()}.
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find your receipt attached.
          </p>
        </div>
      `;
      const html =
        message !== ""
          ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment receipt - Invoice ${invoice.invoiceNumber}</h2>
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
      const emailSubject = subject.trim();

      await sendEmailWithPdf({
        filename: `receipt-${invoice.invoiceNumber}-${String(payment.id)}.pdf`,
        html,
        pdfBuffer,
        subject: emailSubject,
        to: toEmail,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] send-receipt job ${String(job?.id)} failed:`,
      err.message,
    );
  });

  return worker;
}

export function startWorkers(): {
  advanceWorker: Worker<SendAdvanceJobData>;
  estimateWorker: Worker<SendEstimateJobData>;
  invoiceWorker: Worker<SendInvoiceJobData>;
  receiptWorker: Worker<SendReceiptJobData>;
} {
  const invoiceWorker = startSendInvoiceWorker();
  const receiptWorker = startSendReceiptWorker();
  const estimateWorker = startSendEstimateWorker();
  const advanceWorker = startSendAdvanceWorker();
  console.log(
    "[queue] Workers started: email-invoice, email-receipt, email-estimate, email-advance",
  );
  return { advanceWorker, invoiceWorker, receiptWorker, estimateWorker };
}

async function fetchInvoicePdfFromService(
  payload: ReturnType<typeof invoicesService.buildInvoicePdfPayload>,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-invoice`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${String(res.status)} ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function fetchEstimatePdfFromService(
  payload: ReturnType<typeof estimatesService.buildEstimatePdfPayload>,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-estimate`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${String(res.status)} ${text}`);
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
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${String(res.status)} ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function fetchAdvancePdfFromService(
  payload: advancesService.AdvancePdfPayload,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-advance`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": secret,
    },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF service error: ${String(res.status)} ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
