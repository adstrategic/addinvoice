/**
 * Builds the full HTML document for the invoice PDF.
 */

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

export interface InvoicePdfClient {
  name: string;
  businessName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  nit?: string | null;
}

export interface InvoicePdfBusiness {
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  nit?: string | null;
  logo?: string | null;
}

export interface InvoicePdfItem {
  name: string;
  description?: string | null;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;
  tax: number;
  discountAmount?: number;
  total: number;
}

export interface InvoicePdfPayload {
  invoice: {
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate: Date | string;
    purchaseOrder?: string | null;
    currency: string;
    subtotal: number;
    discount: number;
    totalTax: number;
    total: number;
    totalPaid?: number;
    balance?: number;
    notes?: string | null;
    terms?: string | null;
  };
  client: InvoicePdfClient;
  company: InvoicePdfBusiness;
  items: InvoicePdfItem[];
}

export function buildInvoiceHtml(payload: InvoicePdfPayload): string {
  const { invoice, client, company, items } = payload;
  const issueDateStr = formatDate(invoice.issueDate);
  const dueDateStr = formatDate(invoice.dueDate);
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const rowsHtml = items
    .map(
      (item) => `
    <tr>
      <td class="cell-desc">
        <div class="item-name">${escapeHtml(item.name)}</div>
        ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ""}
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
    body { margin: 0; padding: 40px; font-size: 12px; font-family: Helvetica, Arial, sans-serif; }
    .page { position: relative; min-height: 85vh; }
    .watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; }
    .watermark-inner { transform: rotate(-45deg); transform-origin: center center; }
    .watermark-text { font-size: 100px; font-weight: bold; color: #000; opacity: 0.05; text-align: center; letter-spacing: 2px; }
    .content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .company-header { display: flex; align-items: center; gap: 25px; flex: 1; min-width: 0; }
    .company-logo-wrap { height: 120px; max-width: 320px; display: flex; align-items: center; flex-shrink: 0; }
    .company-logo { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: left center; display: block; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 30px; font-weight: bold; color: #00aaab; margin-bottom: 8px; }
    .invoice-details { font-size: 14px; color: #666; margin-top: 2px; }
    .invoice-details b { font-weight: bold; }
    .divider { border-bottom: 1px solid #000; margin: 20px 0; }
    .bill-to-section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #666; }
    .bill-to-content { font-size: 11px; color: #000; margin-top: 2px; }
    .bill-to-label { font-weight: bold; }
    .company-info { text-align: right; }
    .company-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #000; }
    .company-details { font-size: 11px; color: #666; margin-top: 2px; }
    .table-wrap { margin-top: 20px; border: 1px solid #000; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f3f7f9; border-bottom: 1px solid #000; }
    th { padding: 6px; font-size: 11px; font-weight: bold; border-right: 1px solid #000; text-align: right; }
    th.th-desc { text-align: left; flex: 2; }
    th.th-last { border-right: none; }
    td { padding: 6px; font-size: 10px; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: right; }
    .cell-desc { text-align: left; }
    .cell-last { border-right: none; }
    .cell-num { }
    .item-name { font-weight: bold; margin-bottom: 2px; }
    .item-desc { font-size: 9px; color: #666; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; width: 200px; margin-bottom: 5px; font-size: 11px; margin-left: auto; }
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
        <div class="company-header">
          ${company.logo ? `<div class="company-logo-wrap"><img src="${escapeHtml(company.logo)}" alt="" class="company-logo" /></div>` : ""}
        </div>
        <div class="invoice-info">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-details"><b>Invoice #:</b> ${escapeHtml(invoice.invoiceNumber)}</div>
          <div class="invoice-details"><b>Issue Date:</b> ${escapeHtml(issueDateStr)}</div>
          <div class="invoice-details"><b>Due Date:</b> ${escapeHtml(dueDateStr)}</div>
          ${invoice.purchaseOrder ? `<div class="invoice-details">PO: ${escapeHtml(invoice.purchaseOrder)}</div>` : ""}
        </div>
      </div>
      <div class="divider"></div>
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
          invoice.totalPaid !== undefined && invoice.totalPaid !== null
            ? `
        <div class="total-row">
          <span class="total-label">Total paid:</span>
          <span class="total-value">${usdFormatter.format(invoice.totalPaid)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Balance to pay:</span>
          <span class="total-value">${usdFormatter.format(invoice.balance!)}</span>
        </div>`
            : ""
        }
      </div>
      ${
        invoice.notes || invoice.terms
          ? `
      <div class="notes-section">
        ${invoice.notes ? `<div class="notes-title">REMARKS:</div><div style="margin-bottom: 8px">${escapeHtml(invoice.notes)}</div>` : ""}
        ${invoice.terms ? `<div>${escapeHtml(invoice.terms)}</div>` : ""}
      </div>`
          : ""
      }
      <div class="footer">Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
}
