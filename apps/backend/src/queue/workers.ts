import { Worker } from "bullmq";

import type {
  SendAdvanceJobData,
  SendEstimateJobData,
  SendInvoiceJobData,
  SendProposalJobData,
  SendReceiptJobData,
} from "./queues.js";

import * as advancesService from "../features/advances/advances.service.js";
import * as estimatesService from "../features/estimates/estimates.service.js";
import { ensureInvoiceStripePaymentLink } from "../features/invoices/invoice-stripe-payment-link.service.js";
import * as invoicesService from "../features/invoices/invoices.service.js";
import * as paymentsService from "../features/payments/payments.service.js";
import * as proposalsService from "../features/proposals/proposals.service.js";
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

      const paymentLink = await ensureInvoiceStripePaymentLink(
        workspaceId,
        invoice,
      );

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
        process.env.FRONTEND_URL?.trim() ?? "http://localhost:3000";
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
      const advance = await advancesService.getAdvanceById(
        workspaceId,
        advanceId,
      );
      const payload = advancesService.buildAdvancePdfPayload(advance);
      const pdfBuffer = await fetchAdvancePdfFromService(payload);

      const attachmentFiles = await Promise.all(
        advance.attachments.map(async (attachment, index) => {
          try {
            const response = await fetch(attachment.url);
            if (!response.ok) {
              return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const mimeType =
              attachment.mimeType?.trim() ??
              response.headers.get("content-type") ??
              "image/jpeg";
            const extension = mimeType.includes("png")
              ? "png"
              : mimeType.includes("webp")
                ? "webp"
                : "jpg";

            return {
              content: Buffer.from(arrayBuffer) as Buffer,
              filename:
                attachment.fileName?.trim() ??
                `advance-photo-${String(index + 1)}.${extension}`,
            };
          } catch (error) {
            console.error("[queue] Failed to fetch advance attachment:", error);
            return null;
          }
        }),
      );

      function tiptapToHtml(node: Record<string, unknown>): string {
        const type = node.type as string;
        const children = (
          (node.content as Record<string, unknown>[] | undefined) ?? []
        )
          .map(tiptapToHtml)
          .join("");
        if (type === "text") {
          const text = String(node.text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return ((node.marks as undefined | { type: string }[]) ?? []).reduce(
            (acc, m) =>
              m.type === "bold"
                ? `<strong>${acc}</strong>`
                : m.type === "italic"
                  ? `<em>${acc}</em>`
                  : acc,
            text,
          );
        }
        switch (type) {
          case "bulletList":
            return `<ul style="padding-left:16px;">${children}</ul>`;
          case "doc":
            return children;
          case "hardBreak":
            return "<br>";
          case "listItem":
            return `<li>${children}</li>`;
          case "orderedList":
            return `<ol style="padding-left:16px;">${children}</ol>`;
          case "paragraph":
            return `<p style="margin:0 0 4px;line-height:1.6;">${children}</p>`;
          default:
            return children;
        }
      }

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
            ${advance.workCompleted ? tiptapToHtml(advance.workCompleted) : "No work notes provided."}
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
        attachments: attachmentFiles.flatMap((item) => (item ? [item] : [])),
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

export function startSendProposalWorker(): Worker<SendProposalJobData> {
  const worker = new Worker<SendProposalJobData>(
    "email-proposal",
    async (job) => {
      const { email, proposalId, message, subject, workspaceId } = job.data;
      const proposal = await proposalsService.getProposalById(
        workspaceId,
        proposalId,
      );
      const proposalPayload =
        proposalsService.buildProposalPdfPayload(proposal);
      const pdfBuffer = await fetchProposalPdfFromService(proposalPayload);
      const frontendUrl =
        process.env.FRONTEND_URL?.trim() ?? "http://localhost:3000";
      const signingLink =
        proposal.requireSignature && proposal.signingToken
          ? `<p style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px;">
              <strong>Review and sign this proposal:</strong><br/>
              <a href="${frontendUrl}/proposal/accept/${proposal.signingToken}" style="color: #2563eb; word-break: break-all;">
                ${frontendUrl}/proposal/accept/${proposal.signingToken}
              </a>
            </p>`
          : "";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Proposal ${proposal.proposalNumber}</h2>
          <div style="margin: 20px 0; line-height: 1.6; color: #666;">
            ${message
              .split("\n")
              .map((line) => `<p>${line}</p>`)
              .join("")}
          </div>
          ${signingLink}
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Please find the proposal attached as a PDF.
          </p>
        </div>
      `;
      await sendEmailWithPdf({
        filename: `proposal-${proposal.proposalNumber}.pdf`,
        html,
        pdfBuffer,
        subject: subject.trim(),
        to: email,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] send-proposal job ${String(job?.id)} failed:`,
      err.message,
    );
  });
  return worker;
}

export function startWorkers(): {
  advanceWorker: Worker<SendAdvanceJobData>;
  estimateWorker: Worker<SendEstimateJobData>;
  invoiceWorker: Worker<SendInvoiceJobData>;
  proposalWorker: Worker<SendProposalJobData>;
  receiptWorker: Worker<SendReceiptJobData>;
} {
  const invoiceWorker = startSendInvoiceWorker();
  const receiptWorker = startSendReceiptWorker();
  const estimateWorker = startSendEstimateWorker();
  const advanceWorker = startSendAdvanceWorker();
  const proposalWorker = startSendProposalWorker();
  console.log(
    "[queue] Workers started: email-invoice, email-receipt, email-estimate, email-advance, email-proposal",
  );
  return {
    advanceWorker,
    invoiceWorker,
    receiptWorker,
    estimateWorker,
    proposalWorker,
  };
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

async function fetchProposalPdfFromService(
  payload: ReturnType<typeof proposalsService.buildProposalPdfPayload>,
): Promise<Buffer> {
  const url = pdfServiceUrl;
  const secret = pdfServiceSecret;
  if (!url || !secret) {
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/generate-proposal`, {
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
