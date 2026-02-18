import prisma from "../../core/db";
import { sendEmailWithPdf } from "../../lib/email";
import * as invoicesService from "../invoices/invoices.service";
import { InvoiceStatus } from "@addinvoice/db";

const BATCH_SIZE = 50;

function getPdfConfig(): { url: string; secret: string } | null {
  const url = process.env.PDF_SERVICE_URL?.trim();
  const secret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!url || !secret) return null;
  return { url: url.replace(/\/$/, ""), secret };
}

async function fetchInvoicePdfBatch(
  payloads: ReturnType<typeof invoicesService.buildInvoicePdfPayload>[],
): Promise<Buffer[]> {
  const c = getPdfConfig();
  if (!c)
    throw new Error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
  const res = await fetch(`${c.url}/generate-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-PDF-Service-Key": c.secret,
    },
    body: JSON.stringify({ payloads }),
  });
  if (!res.ok) throw new Error("PDF batch error: " + (await res.text()));
  const data = (await res.json()) as { pdfs: string[] };
  return (data.pdfs ?? []).map((b) => Buffer.from(b, "base64"));
}

function messageToHtml(message: string): string {
  const body = message
    .split("\n")
    .map((l) => "<p>" + l + "</p>")
    .join("");
  return (
    '<div style="font-family: Arial; max-width: 600px;"><div style="margin: 20px 0;">' +
    body +
    '</div><p style="color: #999;">Please find the document attached.</p></div>'
  );
}

const ACTIVE_INVOICE_STATUSES = [
  InvoiceStatus.SENT,
  InvoiceStatus.VIEWED,
  InvoiceStatus.OVERDUE,
];

/**
 * Mark invoices that are SENT or VIEWED and past due as OVERDUE.
 * Run daily at 00:00 UTC.
 */
export async function markOverdueInvoices(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.VIEWED] },
      dueDate: { lt: startOfToday },
    },
    data: { status: InvoiceStatus.OVERDUE },
  });
  return result.count;
}

/**
 * Execute reminder emails for eligible invoices at start of day (no outbox).
 * Run daily after markOverdueInvoices. Finds who needs a reminder, batch-generates PDFs, sends emails, updates lastReminderSentAt.
 */
export async function executeReminders(): Promise<{
  sent: number;
  failed: number;
}> {
  const c = getPdfConfig();
  if (!c) return { sent: 0, failed: 0 };
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const todayTime = startOfToday.getTime();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ACTIVE_INVOICE_STATUSES },
    },
    include: { client: true },
  });
  const eligible: typeof invoices = [];
  for (const inv of invoices) {
    const client = inv.client;
    if (!client) continue;
    const due = new Date(inv.dueDate);
    due.setUTCHours(0, 0, 0, 0);
    const dueTime = due.getTime();
    const isPastDue = dueTime < todayTime;
    const intervalDays = isPastDue
      ? client.reminderAfterDueIntervalDays
      : client.reminderBeforeDueIntervalDays;
    if (intervalDays == null || intervalDays < 1) continue;
    const lastSent = inv.lastReminderSentAt;
    const lastSentTime = lastSent ? new Date(lastSent).getTime() : 0;
    const daysSinceLast = lastSentTime
      ? Math.floor((todayTime - lastSentTime) / (24 * 60 * 60 * 1000))
      : intervalDays;
    if (daysSinceLast < intervalDays) continue;
    eligible.push(inv);
  }
  if (eligible.length === 0) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  const payloads: ReturnType<typeof invoicesService.buildInvoicePdfPayload>[] =
    [];
  for (const inv of eligible) {
    const full = await invoicesService.getInvoiceById(inv.workspaceId, inv.id);
    payloads.push(invoicesService.buildInvoicePdfPayload(full));
  }
  let pdfs: Buffer[] = [];
  try {
    pdfs = await fetchInvoicePdfBatch(payloads);
  } catch (err) {
    console.error("[executeReminders] PDF batch failed:", err);
    return { sent: 0, failed: eligible.length };
  }
  for (let i = 0; i < eligible.length; i++) {
    const inv = eligible[i];
    const pdf = pdfs[i];
    if (!pdf) {
      failed++;
      continue;
    }
    const isPastDue = new Date(inv.dueDate).setUTCHours(0, 0, 0, 0) < todayTime;
    const message = `This is a friendly reminder that invoice ${inv.invoiceNumber} is ${isPastDue ? "overdue" : "due soon"}. Please arrange payment at your earliest convenience.`;
    try {
      await sendEmailWithPdf({
        to: inv.clientEmail,
        subject: `Reminder: Invoice ${inv.invoiceNumber}`,
        html: messageToHtml(message),
        pdfBuffer: pdf,
        filename: `invoice-${inv.invoiceNumber}.pdf`,
      });
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { lastReminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(
        `[executeReminders] Failed for invoice ${inv.invoiceNumber}:`,
        err,
      );
      failed++;
    }
  }
  return { sent, failed };
}
