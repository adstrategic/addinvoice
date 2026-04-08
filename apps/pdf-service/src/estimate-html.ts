/**
 * Builds the full HTML document for the estimate PDF.
 *
 * NOTE: These interfaces are aligned with the estimate detail page layout, but we
 * keep the existing QuotePdf* type exports for backwards compatibility with the
 * rest of the PDF service.
 */

export interface EstimatePdfBusiness {
  address?: null | string;
  email?: null | string;
  logo?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface EstimatePdfClient {
  address?: null | string;
  businessName?: null | string;
  description?: null | string;
  email?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface EstimatePdfInvoice {
  currency: string;
  discount: number;
  invoiceNumber: string;
  notes?: null | string;
  status: string;
  subtotal: number;
  summary?: null | string;
  /**
   * Document terms & conditions.
   */
  terms?: null | string;
  timelineEndDate?: Date | null | string;
  timelineStartDate?: Date | null | string;
  total: number;
  totalTax: number;
}

export interface EstimatePdfItem {
  description?: null | string;
  discount?: number;
  discountAmount?: null | number;
  name: string;
  quantity: number;
  /**
   * Optional unit label (e.g. "hours"). If omitted, only the numeric quantity
   * will be rendered.
   */
  quantityUnit?: null | string;
  tax?: null | number;
  total: number;
  unitPrice: number;
}

export interface EstimatePdfPayload {
  client: EstimatePdfClient;
  company: EstimatePdfBusiness;
  invoice: EstimatePdfInvoice;
  items: EstimatePdfItem[];
}

// Backwards compatible type aliases used by the rest of the PDF service.
export type QuotePdfBusiness = EstimatePdfBusiness;
export type QuotePdfClient = EstimatePdfClient;
export type QuotePdfItem = EstimatePdfItem;
export type QuotePdfPayload = EstimatePdfPayload;

export function buildEstimateHtml(payload: EstimatePdfPayload): string {
  const { client, company, invoice, items } = payload;

  const usdFormatter = new Intl.NumberFormat("en-US", {
    currency: invoice.currency || "USD",
    style: "currency",
  });

  const rowsHtml = items
    .map((item) => {
      const quantityLabel = item.quantityUnit
        ? `${String(item.quantity)} ${escapeHtml(item.quantityUnit)}`
        : String(item.quantity);

      const taxLabel =
        item.tax != null ? `${escapeHtml(String(item.tax))}%` : "";

      const discountValue = item.discountAmount ?? item.discount ?? 0;

      return `
    <tr>
      <td class="cell-desc">
        <div class="item-name">${escapeHtml(item.name)}</div>
        ${
          item.description
            ? `<div class="item-desc">${escapeHtml(item.description)}</div>`
            : ""
        }
      </td>
      <td class="cell-num">${escapeHtml(quantityLabel)}</td>
      <td class="cell-num">${usdFormatter.format(item.unitPrice)}</td>
      <td class="cell-num">${taxLabel}</td>
      <td class="cell-num">${usdFormatter.format(discountValue)}</td>
      <td class="cell-num cell-last">${usdFormatter.format(item.total)}</td>
    </tr>`;
    })
    .join("");

  const hasTimeline =
    invoice.timelineStartDate ?? invoice.timelineEndDate ?? null;

  const timelineStart = invoice.timelineStartDate
    ? formatDate(invoice.timelineStartDate)
    : "";
  const timelineEnd = invoice.timelineEndDate
    ? formatDate(invoice.timelineEndDate)
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px; font-size: 12px; font-family: Helvetica, Arial, sans-serif; }
    .page { position: relative; min-height: 85vh; }
    .watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; }
    .watermark-inner { transform: rotate(-45deg); transform-origin: center center; }
    .watermark-text { font-size: 100px; font-weight: bold; color: #000; opacity: 0.05; text-align: center; letter-spacing: 2px; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .company-header { display: flex; align-items: center; gap: 25px; flex: 1; min-width: 0; justify-content: flex-end; }
    .company-logo-wrap { height: 120px; max-width: 320px; display: flex; align-items: center; flex-shrink: 0; }
    .company-logo { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: left center; display: block; }
    .estimate-header-left { display: flex; flex-direction: column; gap: 4px; }
    .estimate-title { font-size: 30px; font-weight: bold; color: #111; letter-spacing: 0.02em; }
    .estimate-number { font-size: 12px; color: #888; font-weight: 600; }
    .divider { border-bottom: 1px solid #000; margin: 20px 0; }
    .bill-to-section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #666; }
    .bill-to-content { font-size: 11px; color: #000; margin-top: 2px; }
    .bill-to-label { font-weight: bold; }
    .company-info { text-align: right; }
    .company-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #000; }
    .company-details { font-size: 11px; color: #666; margin-top: 2px; }
    .summary-section { margin-top: 16px; border: 1px solid #ddd; border-radius: 8px; padding: 12px; font-size: 11px; }
    .summary-title { font-weight: 600; color: #666; margin-bottom: 4px; text-transform: uppercase; }
    .summary-text { color: #444; }
    .timeline-section { margin-top: 16px; font-size: 11px; }
    .timeline-title { font-weight: 600; color: #666; margin-bottom: 6px; text-transform: uppercase; }
    .timeline-line { border-left: 1px solid #000; border-top: 1px solid #000; border-right: 1px solid #000; height: 2px; width: 100%; }
    .timeline-dates { display: flex; justify-content: space-between; margin-top: 4px; color: #666; }
    .table-wrap { margin-top: 20px; border: 1px solid #000; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f3f7f9; border-bottom: 1px solid #000; }
    th { padding: 6px; font-size: 11px; font-weight: bold; border-right: 1px solid #000; text-align: right; }
    th.th-desc { text-align: left; }
    th.th-last { border-right: none; }
    td { padding: 6px; font-size: 10px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right; }
    .cell-desc { text-align: left; }
    .cell-last { border-right: none; }
    .cell-num { }
    .item-name { font-weight: bold; margin-bottom: 2px; }
    .item-desc { font-size: 9px; color: #666; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; width: 220px; margin-bottom: 5px; font-size: 11px; margin-left: auto; }
    .total-label { color: #666; }
    .total-value { font-weight: bold; color: #000; }
    .total-final { font-size: 14px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; }
    .total-final-value { color: #00aaab; }
    .notes-section { margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; font-size: 11px; }
    .notes-title { font-weight: bold; margin-bottom: 4px; }
    .footer { position: fixed; bottom: 30px; left: 32px; right: 32px; text-align: center; font-size: 9px; color: #999; }
  </style>
</head>
<body>
  <div class="page">
    <div class="watermark">
      <div class="watermark-inner">
        <div class="watermark-text">${escapeHtml(company.name)}</div>
      </div>
    </div>
    <div class="content">
      <div class="header">
        <div class="estimate-header-left">
          <div class="estimate-title">ESTIMATE</div>
          <div class="estimate-number"># ${escapeHtml(invoice.invoiceNumber)}</div>
        </div>
        <div class="company-header">
          ${
            company.logo
              ? `<div class="company-logo-wrap"><img src="${escapeHtml(company.logo)}" alt="Company Logo" class="company-logo" /></div>`
              : ""
          }
        </div>
      </div>
      <div class="divider"></div>
      <div class="header">
        <div class="bill-to-section">
          <div class="section-title">BILL TO:</div>
          <div class="bill-to-content bill-to-label">${escapeHtml(
            client.name,
          )}</div>
          ${
            client.businessName
              ? `<div class="bill-to-content">${escapeHtml(client.businessName)}</div>`
              : ""
          }
          ${
            client.address
              ? `<div class="bill-to-content">${escapeHtml(client.address)}</div>`
              : ""
          }
          ${
            client.phone
              ? `<div class="bill-to-content">${escapeHtml(client.phone)}</div>`
              : ""
          }
          ${
            client.email
              ? `<div class="bill-to-content">${escapeHtml(client.email)}</div>`
              : ""
          }
          ${
            client.nit
              ? `<div class="bill-to-content">NIT: ${escapeHtml(client.nit)}</div>`
              : ""
          }
        </div>
        <div class="company-info">
          <div class="company-name">${escapeHtml(company.name)}</div>
          ${
            company.address
              ? `<div class="company-details">${escapeHtml(company.address)}</div>`
              : ""
          }
          ${
            company.nit
              ? `<div class="company-details">NIT: ${escapeHtml(company.nit)}</div>`
              : ""
          }
          ${
            company.email
              ? `<div class="company-details">Email: ${escapeHtml(company.email)}</div>`
              : ""
          }
          ${
            company.phone
              ? `<div class="company-details">Phone: ${escapeHtml(company.phone)}</div>`
              : ""
          }
        </div>
      </div>
      ${
        invoice.summary
          ? `
      <div class="summary-section">
        <div class="summary-title">Project Summary:</div>
        <div class="summary-text">${escapeHtml(invoice.summary)}</div>
      </div>`
          : ""
      }
      ${
        hasTimeline
          ? `
      <div class="timeline-section">
        <div class="timeline-title">Timeline:</div>
        <div class="timeline-line"></div>
        <div class="timeline-dates">
          <span>${escapeHtml(timelineStart)}</span>
          <span>${escapeHtml(timelineEnd)}</span>
        </div>
      </div>`
          : ""
      }
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="th-desc" style="width: 40%">DESCRIPTION</th>
              <th style="width: 10%">QTY</th>
              <th style="width: 15%">UNIT PRICE</th>
              <th style="width: 10%">TAX</th>
              <th style="width: 15%">DISCOUNT</th>
              <th class="th-last" style="width: 15%">AMOUNT</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}
          </tbody>
        </table>
      </div>
      <div class="totals">
        <div class="total-row">
          <span class="total-label">Subtotal:</span>
          <span class="total-value">${usdFormatter.format(invoice.subtotal)}</span>
        </div>
        ${
          invoice.discount > 0
            ? `
        <div class="total-row">
          <span class="total-label">Discount:</span>
          <span class="total-value">-${usdFormatter.format(invoice.discount)}</span>
        </div>`
            : ""
        }
        <div class="total-row">
          <span class="total-label">Tax:</span>
          <span class="total-value">${usdFormatter.format(invoice.totalTax)}</span>
        </div>
        <div class="total-row total-final">
          <span class="total-label">Total:</span>
          <span class="total-value total-final-value">${usdFormatter.format(invoice.total)}</span>
        </div>
      </div>
      ${
        invoice.notes || invoice.terms
          ? `
      <div class="notes-section">
        ${
          invoice.notes
            ? `<div class="notes-title">Notes:</div><div style="margin-bottom: 8px">${escapeHtml(invoice.notes)}</div>`
            : ""
        }
        ${
          invoice.terms
            ? `<div class="notes-title">Terms &amp; Conditions:</div><div>${escapeHtml(invoice.terms)}</div>`
            : ""
        }
      </div>`
          : ""
      }
      <div class="footer">Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

