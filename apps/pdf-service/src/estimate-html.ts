import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

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

export interface EstimatePdfDescriptiveItem {
  description?: null | Record<string, unknown>;
  title: string;
}

export interface EstimatePdfInvoice {
  currency: string;
  discount: number;
  exclusions?: null | Record<string, unknown>;
  invoiceNumber: string;
  notes?: null | Record<string, unknown>;
  signature?: EstimatePdfSignature | null;
  status: string;
  subtotal: number;
  summary?: null | Record<string, unknown>;
  /**
   * Document terms & conditions.
   */
  terms?: null | Record<string, unknown>;
  timelineEndDate?: Date | null | string;
  timelineStartDate?: Date | null | string;
  total: number;
  totalTax: number;
}

export interface EstimatePdfItem {
  description?: null | Record<string, unknown>;
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
  descriptiveItems?: EstimatePdfDescriptiveItem[];
  invoice: EstimatePdfInvoice;
  items: EstimatePdfItem[];
}

export interface EstimatePdfSignature {
  fullName: string;
  signatureImageUrl?: string;
  signedAt: string;
}

// Backwards compatible type aliases used by the rest of the PDF service.
export type QuotePdfBusiness = EstimatePdfBusiness;
export type QuotePdfClient = EstimatePdfClient;
export type QuotePdfItem = EstimatePdfItem;
export type QuotePdfPayload = EstimatePdfPayload;

export function buildEstimateHtml(payload: EstimatePdfPayload): string {
  const { client, company, descriptiveItems = [], invoice, items } = payload;

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
            ? `<div class="item-desc">${generateHTML(item.description, [StarterKit])}</div>`
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
  const descriptiveColumns = Math.min(3, Math.max(1, descriptiveItems.length));
  const descriptiveItemsHtml = descriptiveItems
    .map((item) => {
      return `
      <div class="descriptive-item">
        <div class="descriptive-item-title">${escapeHtml(item.title)}</div>
        ${
          item.description
            ? `<div class="descriptive-item-description">${generateHTML(item.description, [StarterKit])}</div>`
            : ""
        }
      </div>`;
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
    body { margin: 0; padding: 0; font-size: 12px; font-family: Helvetica, Arial, sans-serif; }
    .page-table { width: 100%; border-collapse: collapse; }
    .page-table > thead { display: table-header-group; }
    .page-table > thead > tr > td,
    .page-table > tbody > tr > td { padding: 0; vertical-align: top; }
    .page-header { padding: 14px 40px 10px; background: #fff; }
    .page-header-inner { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; }
    .page-header-left { display: flex; flex-direction: column; gap: 2px; }
    .page-header-title { font-size: 24px; font-weight: bold; color: #111; }
    .page-header-number { font-size: 11px; color: #888; font-weight: 600; }
    .page-header-logo { max-height: 50px; width: auto; max-width: 200px; object-fit: contain; display: block; }
    .page-header-divider { border-bottom: 1px solid #000; }
    .page-body { padding: 0 40px; min-height: 85vh; }
    .watermark { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; display: flex; justify-content: center; align-items: center; pointer-events: none; }
    .watermark-inner { transform: rotate(-45deg); transform-origin: center center; }
    .watermark-text { font-size: 100px; font-weight: bold; color: #000; opacity: 0.03; text-align: center; letter-spacing: 2px; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
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
    .summary-text p { margin: 0 0 4px; }
    .summary-text ul { list-style: disc; padding-left: 16px; margin: 4px 0; }
    .summary-text ol { list-style: decimal; padding-left: 16px; margin: 4px 0; }
    .summary-text li { margin-bottom: 2px; }
    .summary-text strong { font-weight: 700; }
    .summary-text em { font-style: italic; }
    .summary-text h2 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; color: #111; }
    .summary-text h3 { font-size: 12px; font-weight: 700; margin: 6px 0 4px; color: #111; }
    .timeline-section { margin-top: 16px; font-size: 11px; }
    .timeline-title { font-weight: 600; color: #666; margin-bottom: 6px; text-transform: uppercase; }
    .timeline-line { border-left: 1px solid #000; border-top: 1px solid #000; border-right: 1px solid #000; height: 2px; width: 100%; }
    .timeline-dates { display: flex; justify-content: space-between; margin-top: 4px; color: #666; }
    .descriptive-items-section { margin-top: 16px; border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
    .descriptive-items-title { font-weight: 600; color: #666; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; }
    .descriptive-items-grid { display: grid; gap: 10px; }
    .descriptive-item { border: 1px solid #e6e6e6; border-radius: 8px; padding: 10px; min-height: 90px; }
    .descriptive-item-title { font-size: 11px; font-weight: 700; margin-bottom: 6px; color: #111; }
    .descriptive-item-description { font-size: 10px; color: #444; }
    .descriptive-item-description p { margin: 0 0 4px; }
    .descriptive-item-description ul { list-style: disc; padding-left: 12px; margin: 2px 0; }
    .descriptive-item-description ol { list-style: decimal; padding-left: 12px; margin: 2px 0; }
    .descriptive-item-description li { margin-bottom: 2px; }
    .descriptive-item-description strong { font-weight: 700; }
    .descriptive-item-description em { font-style: italic; }
    .table-wrap { margin-top: 20px; border: 1px solid #000; border-radius: 10px; overflow: hidden; }
    .table-wrap table { width: 100%; border-collapse: collapse; }
    .table-wrap thead { background: #f3f7f9; border-bottom: 1px solid #000; }
    .table-wrap th { padding: 6px; font-size: 11px; font-weight: bold; border-right: 1px solid #000; text-align: right; }
    .table-wrap th.th-desc { text-align: left; }
    .table-wrap th.th-last { border-right: none; }
    .table-wrap td { padding: 6px; font-size: 10px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right; }
    .table-wrap .cell-desc { text-align: left; }
    .table-wrap .cell-last { border-right: none; }
    .table-wrap .cell-num { }
    .item-name { font-weight: bold; margin-bottom: 2px; }
    .item-desc { font-size: 9px; color: #666; }
    .item-desc p { margin: 0; }
    .item-desc ul { list-style: disc; padding-left: 12px; margin: 2px 0; }
    .item-desc ol { list-style: decimal; padding-left: 12px; margin: 2px 0; }
    .item-desc strong { font-weight: 700; }
    .item-desc em { font-style: italic; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; width: 220px; margin-bottom: 5px; font-size: 11px; margin-left: auto; }
    .total-label { color: #666; }
    .total-value { font-weight: bold; color: #000; }
    .total-final { font-size: 14px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; }
    .total-final-value { color: #00aaab; }
    .notes-section { margin-top: 30px; padding-top: 10px; font-size: 11px; }
    .notes-title { font-weight: bold; margin-bottom: 4px; }
    .notes-section p { margin: 0 0 4px; }
    .notes-section ul { list-style: disc; padding-left: 16px; margin: 4px 0; }
    .notes-section ol { list-style: decimal; padding-left: 16px; margin: 4px 0; }
    .notes-section li { margin-bottom: 2px; }
    .notes-section strong { font-weight: 700; }
    .notes-section em { font-style: italic; }
    .notes-section h2 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; color: #111; }
    .notes-section h3 { font-size: 12px; font-weight: 700; margin: 6px 0 4px; color: #111; }
    .signature-section { margin-top: 30px; padding-top: 16px; }
    .signature-label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .signature-image { max-width: 200px; max-height: 80px; object-fit: contain; display: block; margin-bottom: 8px; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; margin-bottom: 6px; }
    .signature-name { font-size: 12px; font-weight: bold; color: #111; }
    .signature-date { font-size: 11px; color: #666; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="watermark">
    <div class="watermark-inner">
      <div class="watermark-text">${escapeHtml(company.name)}</div>
    </div>
  </div>
  <table class="page-table">
    <thead>
      <tr>
        <td>
          <div class="page-header">
            <div class="page-header-inner">
              <div class="page-header-left">
                <div class="page-header-title">ESTIMATE</div>
                <div class="page-header-number"># ${escapeHtml(invoice.invoiceNumber)}</div>
              </div>
              ${company.logo ? `<img src="${escapeHtml(company.logo)}" alt="" class="page-header-logo" />` : ""}
            </div>
            <div class="page-header-divider"></div>
          </div>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="page-body">
            <div class="content">
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
        <div class="summary-text">${generateHTML(invoice.summary, [StarterKit])}</div>
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
      ${
        descriptiveItems.length > 0
          ? `
      <div class="descriptive-items-section">
        <div class="descriptive-items-title">Descriptive items</div>
        <div class="descriptive-items-grid" style="grid-template-columns: repeat(${String(descriptiveColumns)}, minmax(0, 1fr));">
          ${descriptiveItemsHtml}
        </div>
      </div>`
          : ""
      }
      ${
        invoice.exclusions
          ? `
      <div class="summary-section" style="margin-top: 16px;">
        <div class="summary-title">Exclusions:</div>
        <div class="summary-text">${generateHTML(invoice.exclusions, [StarterKit])}</div>
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
            ? `<div class="notes-title">Notes:</div><div style="margin-bottom: 8px">${generateHTML(invoice.notes, [StarterKit])}</div>`
            : ""
        }
        ${
          invoice.terms
            ? `<div class="notes-title">Terms &amp; Conditions:</div><div>${generateHTML(invoice.terms, [StarterKit])}</div>`
            : ""
        }
      </div>`
          : ""
      }
      ${
        invoice.signature
          ? `
      <div class="signature-section">
        <div class="signature-label">Accepted by</div>
        ${invoice.signature.signatureImageUrl ? `<img src="${escapeHtml(invoice.signature.signatureImageUrl)}" alt="Signature" class="signature-image" />` : ""}
        <div class="signature-line"></div>
        <div class="signature-name">${escapeHtml(invoice.signature.fullName)}</div>
        <div class="signature-date">Signed: ${escapeHtml(formatDate(invoice.signature.signedAt))}</div>
      </div>`
          : ""
      }
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
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
