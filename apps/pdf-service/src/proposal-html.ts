import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

export interface ProposalPdfBusiness {
  address?: null | string;
  email?: null | string;
  logo?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface ProposalPdfClient {
  address?: null | string;
  businessName?: null | string;
  email?: null | string;
  logo?: null | string;
  name: string;
  nit?: null | string;
  phone?: null | string;
}

export interface ProposalPdfDescriptiveItem {
  description?: null | Record<string, unknown>;
  title: string;
}

export interface ProposalPdfDocument {
  currency: string;
  exclusions?: null | Record<string, unknown>;
  notes?: null | Record<string, unknown>;
  proposalNumber: string;
  summary?: null | Record<string, unknown>;
  terms?: null | Record<string, unknown>;
  timelineEndDate?: Date | null | string;
  timelineStartDate?: Date | null | string;
  total: number;
}

export interface ProposalPdfPayload {
  client: ProposalPdfClient;
  company: ProposalPdfBusiness;
  descriptiveItems?: ProposalPdfDescriptiveItem[];
  document: ProposalPdfDocument;
}

export function buildProposalHtml(payload: ProposalPdfPayload): string {
  const { client, company, descriptiveItems = [], document } = payload;

  const usdFormatter = new Intl.NumberFormat("en-US", {
    currency: document.currency || "USD",
    style: "currency",
  });

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
    document.timelineStartDate ?? document.timelineEndDate ?? null;

  const timelineStart = document.timelineStartDate
    ? formatDate(document.timelineStartDate)
    : "";
  const timelineEnd = document.timelineEndDate
    ? formatDate(document.timelineEndDate)
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
    .divider { border-bottom: 1px solid #000; margin: 20px 0; }
    .bill-to-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .bill-to-row.prepared-by-row { margin-bottom: 20px; padding-top: 12px; border-top: 1px solid #eee; }
    .bill-to-section { flex: 1; }
    .client-logo-wrap { height: 80px; max-width: 200px; display: flex; align-items: center; flex-shrink: 0; margin-left: 24px; }
    .client-logo { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: right center; display: block; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 6px; color: #666; }
    .bill-to-content { font-size: 16px; color: #000; margin-top: 2px; }
    .bill-to-label { font-weight: bold; }
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
    .total-block { margin-top: 24px; display: flex; justify-content: flex-end; }
    .total-box { border: 1px solid #000; border-radius: 10px; padding: 14px 20px; min-width: 220px; }
    .total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
    .total-label { color: #444; }
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
                <div class="page-header-title">PROPOSAL</div>
                <div class="page-header-number"># ${escapeHtml(document.proposalNumber)}</div>
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
      <div class="bill-to-row">
        <div class="bill-to-section">
          <div class="section-title">PREPARED FOR:</div>
          <div class="bill-to-content bill-to-label">${escapeHtml(client.name)}</div>
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
        ${
          client.logo
            ? `<div class="client-logo-wrap"><img src="${escapeHtml(client.logo)}" alt="${escapeHtml(client.name)} Logo" class="client-logo" /></div>`
            : ""
        }
      </div>
      <div class="bill-to-row prepared-by-row">
        <div class="bill-to-section">
          <div class="section-title">PREPARED BY:</div>
          <div class="bill-to-content bill-to-label">${escapeHtml(company.name)}</div>
          ${
            company.address
              ? `<div class="bill-to-content">${escapeHtml(company.address)}</div>`
              : ""
          }
          ${
            company.nit
              ? `<div class="bill-to-content">NIT: ${escapeHtml(company.nit)}</div>`
              : ""
          }
          ${
            company.email
              ? `<div class="bill-to-content">${escapeHtml(company.email)}</div>`
              : ""
          }
          ${
            company.phone
              ? `<div class="bill-to-content">${escapeHtml(company.phone)}</div>`
              : ""
          }
        </div>
      </div>
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
        document.summary || descriptiveItems.length > 0
          ? `
      <div class="descriptive-items-section">
        <div class="descriptive-items-title">Scope of Work</div>
        ${
          document.summary
            ? `<div class="summary-text" style="margin-bottom: 12px;">${generateHTML(document.summary, [StarterKit])}</div>`
            : ""
        }
        ${
          descriptiveItems.length > 0
            ? `<div class="descriptive-items-grid" style="grid-template-columns: repeat(${String(descriptiveColumns)}, minmax(0, 1fr));">
          ${descriptiveItemsHtml}
        </div>`
            : ""
        }
      </div>`
          : ""
      }
      ${
        document.exclusions
          ? `
      <div class="summary-section" style="margin-top: 16px;">
        <div class="summary-title">Exclusions:</div>
        <div class="summary-text">${generateHTML(document.exclusions, [StarterKit])}</div>
      </div>`
          : ""
      }
      <div class="total-block">
        <div class="total-box">
          <div class="total-final">
            <span class="total-label">Total:</span>
            <span class="total-final-value">${usdFormatter.format(document.total)}</span>
          </div>
        </div>
      </div>
      ${
        ""
        /*
        document.notes || document.terms
          ? `
      <div class="notes-section">
        ${
          document.notes
            ? `<div class="notes-title">Notes:</div><div style="margin-bottom: 8px">${generateHTML(document.notes, [StarterKit])}</div>`
            : ""
        }
        ${
          document.terms
            ? `<div class="notes-title">Terms &amp; Conditions:</div><div>${generateHTML(document.terms, [StarterKit])}</div>`
            : ""
        }
      </div>`
          : ""
        */
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
