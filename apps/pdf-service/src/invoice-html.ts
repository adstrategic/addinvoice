import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

/**
 * Builds the full HTML document for the invoice PDF.
 */

export interface InvoicePdfBusiness {
  address?: null | string;
  email?: null | string;
  logo?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface InvoicePdfClient {
  address?: null | string;
  businessName?: null | string;
  email?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface InvoicePdfItem {
  description?: null | Record<string, unknown>;
  discountAmount?: number;
  name: string;
  quantity: number;
  quantityUnit: string;
  tax: number;
  total: number;
  unitPrice: number;
}

export interface InvoicePdfPayload {
  client: InvoicePdfClient;
  company: InvoicePdfBusiness;
  invoice: {
    balance?: number;
    currency: string;
    discount: number;
    dueDate: Date | string;
    invoiceNumber: string;
    issueDate: Date | string;
    notes?: null | Record<string, unknown>;
    purchaseOrder?: null | string;
    subtotal: number;
    terms?: null | Record<string, unknown>;
    total: number;
    totalPaid?: number;
    totalTax: number;
  };
  items: InvoicePdfItem[];
  paymentMethod?: null | { handle: null | string; type: string };
}

export function buildInvoiceHtml(payload: InvoicePdfPayload): string {
  const { client, company, invoice, items } = payload;
  const issueDateStr = formatDate(invoice.issueDate);
  const dueDateStr = formatDate(invoice.dueDate);
  const usdFormatter = new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  });

  const rowsHtml = items
    .map(
      (item) => `
    <tr>
      <td class="cell-desc">
        <div class="item-name">${escapeHtml(item.name)}</div>
        ${item.description ? `<div class="item-desc">${generateHTML(item.description, [StarterKit])}</div>` : ""}
      </td>
      <td class="cell-num">${escapeHtml(String(item.quantity))} ${escapeHtml(item.quantityUnit)}</td>
      <td class="cell-num">${usdFormatter.format(item.unitPrice)}</td>
      <td class="cell-num">${escapeHtml(String(item.tax))}%</td>
      <td class="cell-num">${usdFormatter.format(item.discountAmount ?? 0)}</td>
      <td class="cell-num cell-last">${usdFormatter.format(item.total)}</td>
    </tr>`,
    )
    .join("");

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
    .page-header-inner { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; gap: 16px; }
    .page-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .page-header-title { font-size: 28px; font-weight: bold; color: #00aaab; line-height: 1.1; }
    .page-header-meta { font-size: 12px; color: #666; }
    .page-header-meta b { font-weight: bold; color: #000; }
    .page-header-logo { max-height: 60px; width: auto; max-width: 200px; object-fit: contain; display: block; }
    .page-header-divider { border-bottom: 1px solid #000; }
    .page-body { padding: 0 40px; min-height: 85vh; }
    .watermark { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; display: flex; justify-content: center; align-items: center; pointer-events: none; }
    .watermark-inner { transform: rotate(-45deg); transform-origin: center center; }
    .watermark-text { font-size: 100px; font-weight: bold; color: #000; opacity: 0.03; text-align: center; letter-spacing: 2px; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .bill-to-section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #666; }
    .bill-to-content { font-size: 11px; color: #000; margin-top: 2px; }
    .bill-to-label { font-weight: bold; }
    .company-info { text-align: right; }
    .company-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #000; }
    .company-details { font-size: 11px; color: #666; margin-top: 2px; }
    .table-wrap { margin-top: 20px; border: 1px solid #000; border-radius: 10px; overflow: hidden; }
    .table-wrap table { width: 100%; border-collapse: collapse; }
    .table-wrap thead { background: #f3f7f9; border-bottom: 1px solid #000; }
    .table-wrap th { padding: 6px; font-size: 11px; font-weight: bold; border-right: 1px solid #000; text-align: right; }
    .table-wrap th.th-desc { text-align: left; flex: 2; }
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
    .total-row { display: flex; justify-content: space-between; width: 200px; margin-bottom: 5px; font-size: 11px; margin-left: auto; }
    .total-label { color: #666; }
    .total-value { font-weight: bold; color: #000; }
    .total-final { font-size: 14px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; }
    .total-final-value { color: #00aaab; }
    .notes-section { margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; font-size: 11px; }
    .notes-title { font-weight: bold; margin-bottom: 4px; }
    .notes-section p { margin: 0 0 4px; }
    .notes-section ul { list-style: disc; padding-left: 16px; margin: 4px 0; }
    .notes-section ol { list-style: decimal; padding-left: 16px; margin: 4px 0; }
    .notes-section li { margin-bottom: 2px; }
    .notes-section strong { font-weight: 700; }
    .notes-section em { font-style: italic; }
    .notes-section h2 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; color: #111; }
    .notes-section h3 { font-size: 12px; font-weight: 700; margin: 6px 0 4px; color: #111; }
    .payment-method-section { margin-top: 16px; font-size: 11px; border: 1px solid #00aaab; padding: 8px; }
    .payment-method-label { font-weight: bold; }
    .payment-method-value { margin-left: 4px; }
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
              ${company.logo ? `<img src="${escapeHtml(company.logo)}" alt="" class="page-header-logo" />` : `<div></div>`}
              <div class="page-header-right">
                <div class="page-header-title">INVOICE</div>
                <div class="page-header-meta"><b>Invoice #:</b> ${escapeHtml(invoice.invoiceNumber)}</div>
                <div class="page-header-meta"><b>Issue Date:</b> ${escapeHtml(issueDateStr)}</div>
                <div class="page-header-meta"><b>Due Date:</b> ${escapeHtml(dueDateStr)}</div>
                ${invoice.purchaseOrder ? `<div class="page-header-meta"><b>PO:</b> ${escapeHtml(invoice.purchaseOrder)}</div>` : ""}
              </div>
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
          <div class="section-title">BILLED TO:</div>
          <div class="bill-to-content bill-to-label">NAME: ${escapeHtml(client.name)}</div>
          ${client.businessName ? `<div class="bill-to-content">BUSINESS: ${escapeHtml(client.businessName)}</div>` : ""}
          ${client.address ? `<div class="bill-to-content">ADDRESS: ${escapeHtml(client.address)}</div>` : ""}
          ${client.phone ? `<div class="bill-to-content">PHONE: ${escapeHtml(client.phone)}</div>` : ""}
          ${client.email ? `<div class="bill-to-content">EMAIL: ${escapeHtml(client.email)}</div>` : ""}
          ${client.nit ? `<div class="bill-to-content">NIT: ${escapeHtml(client.nit)}</div>` : ""}
        </div>
        <div class="company-info">
          <div class="company-name">${escapeHtml(company.name)}</div>
          ${company.address ? `<div class="company-details">${escapeHtml(company.address)}</div>` : ""}
          ${company.phone ? `<div class="company-details">Phone: ${escapeHtml(company.phone)}</div>` : ""}
          ${company.email ? `<div class="company-details">Email: ${escapeHtml(company.email)}</div>` : ""}
          ${company.nit ? `<div class="company-details">NIT: ${escapeHtml(company.nit)}</div>` : ""}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="th-desc" style="width: 35%">DESCRIPTION</th>
              <th style="width: 12%">QTY</th>
              <th style="width: 13%">UNIT PRICE</th>
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
          <span class="total-label">Invoice total:</span>
          <span class="total-value total-final-value">${usdFormatter.format(invoice.total)}</span>
        </div>
        ${
          invoice.totalPaid != null
            ? `
        <div class="total-row">
          <span class="total-label">Total paid:</span>
          <span class="total-value">${usdFormatter.format(invoice.totalPaid)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Balance to pay:</span>
          <span class="total-value">${usdFormatter.format(invoice.balance ?? 0)}</span>
        </div>`
            : ""
        }
      </div>
       ${
         payload.paymentMethod
           ? `
      <div class="payment-method-section">
        <span class="payment-method-label">Payment method:</span>
        <span class="payment-method-value">
          ${escapeHtml(capitalize(payload.paymentMethod.type))}
          ${payload.paymentMethod.handle ? ` (${escapeHtml(payload.paymentMethod.handle)})` : ""}
        </span>
      </div>`
           : ""
       }
      
      ${
        invoice.notes || invoice.terms
          ? `
      <div class="notes-section">
        ${invoice.notes ? `<div class="notes-title">REMARKS:</div><div style="margin-bottom: 8px">${generateHTML(invoice.notes, [StarterKit])}</div>` : ""}
        ${invoice.terms ? `<div>${generateHTML(invoice.terms, [StarterKit])}</div>` : ""}
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

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
  return new Date(date).toLocaleDateString();
}
