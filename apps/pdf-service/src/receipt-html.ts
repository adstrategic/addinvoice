/**
 * Builds the full HTML document for the receipt PDF.
 */

import type { ReceiptPdfPayload } from "./schema";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
}

export function buildReceiptHtml(payload: ReceiptPdfPayload): string {
  const { company, client, invoice, payment, payments } = payload;

  const currentInvoice = {
    logo: company.logo ?? null,
    companyName: company.name,
    companyAddress: company.address ?? null,
    clientName: client.name,
    clientEmail: client.email ?? null,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    status: invoice.status,
    totalPaid: invoice.totalPaid,
    payments,
  };

  return `<!DOCTYPE html>
<html>
<head>
  <title>Payment Receipt ${escapeHtml(payment.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
    .logo { max-height: 80px; margin-bottom: 10px; }
    .title { font-size: 24px; font-weight: bold; color: #1ECAD3; }
    .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .section-title { font-weight: bold; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; color: #888; }
    .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
    .amount-label { font-size: 14px; color: #166534; }
    .amount-value { font-size: 32px; font-weight: bold; color: #15803d; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; }
    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    ${currentInvoice.logo ? `<img src="${escapeHtml(currentInvoice.logo)}" class="logo" />` : ""}
    <div class="title">PAYMENT RECEIPT</div>
    <div class="subtitle">${escapeHtml(currentInvoice.companyName)}</div>
    ${currentInvoice.companyAddress ? `<div>${escapeHtml(currentInvoice.companyAddress)}</div>` : ""}
  </div>

  <div class="amount-box">
    <div class="amount-label">AMOUNT PAID</div>
    <div class="amount-value">${formatCurrency(payment.amount, invoice.currency)}</div>
    <div style="margin-top: 10px; font-size: 14px; color: #666;">
        Method: ${escapeHtml(payment.method.toUpperCase())}
    </div>
  </div>

  <div class="details">
    <div>
      <div class="section-title">RECEIVED FROM</div>
      <div><strong>${escapeHtml(currentInvoice.clientName)}</strong></div>
      ${currentInvoice.clientEmail ? `<div>${escapeHtml(currentInvoice.clientEmail)}</div>` : ""}
    </div>
    <div style="text-align: right;">
      <div class="section-title">PAYMENT DETAILS</div>
      <div>Date: ${escapeHtml(payment.date)}</div>
      <div>Receipt #: ${escapeHtml(String(payment.id).slice(-6))}</div>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <div class="section-title">APPLIED TO INVOICE</div>
    <div class="info-row">
      <span>Invoice Number</span>
      <span>${escapeHtml(currentInvoice.invoiceNumber)}</span>
    </div>
    <div class="info-row">
      <span>Invoice Total</span>
      <span>${formatCurrency(currentInvoice.total, invoice.currency)}</span>
    </div>
    <div class="info-row">
      <span>Payment Status</span>
      <span>${escapeHtml(currentInvoice.status.toUpperCase())}</span>
    </div>
    <div class="info-row">
      <span>Paid to Date</span>
      <span>${formatCurrency(currentInvoice.totalPaid, invoice.currency)}</span>
    </div>
    <div class="info-row">
      <span>Balance Due</span>
      <span style="color: ${currentInvoice.total - currentInvoice.totalPaid > 0.01 ? "#dc2626" : "#166534"}; font-weight: bold;">
        ${formatCurrency(Math.max(0, invoice.balance), invoice.currency)}
      </span>
    </div>
  </div>

  ${currentInvoice.payments && currentInvoice.payments.length > 0 ? `
  <div style="margin-bottom: 30px;">
    <div class="section-title">PAYMENT HISTORY</div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="border-bottom: 1px solid #eee; text-align: left;">
          <th style="padding: 8px 0; font-size: 12px; color: #666;">DATE</th>
          <th style="padding: 8px 0; font-size: 12px; color: #666;">METHOD</th>
          <th style="padding: 8px 0; font-size: 12px; color: #666; text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${currentInvoice.payments
          .map(
            (p) => `
        <tr style="border-bottom: 1px solid #f9fafb;">
          <td style="padding: 10px 0;">${escapeHtml(p.date)}</td>
          <td style="padding: 10px 0; text-transform: capitalize;">${escapeHtml(p.method)}</td>
          <td style="padding: 10px 0; text-align: right;">${formatCurrency(p.amount, invoice.currency)}</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${payment.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 5px;">
    <div class="section-title">NOTES</div>
    <div>${escapeHtml(payment.notes)}</div>
  </div>
  ` : ""}

  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>
`;
}
