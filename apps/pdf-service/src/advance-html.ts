import type { AdvancePdfPayload } from "./schema.js";

export function buildAdvanceHtml(payload: AdvancePdfPayload): string {
  const formattedDate = formatDate(payload.advance.advanceDate);
  const photosHtml = payload.attachments
    .map(
      (attachment) => `
      <div class="photo-card">
        <img src="${escapeHtml(attachment.url)}" alt="Site photo" />
      </div>
    `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; font-family: Helvetica, Arial, sans-serif; color: #111; }
    .sheet { border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .content { background: #fff; padding: 40px; }
    .header { border-bottom: 2px solid rgba(17, 24, 39, 0.1); padding-bottom: 18px; margin-bottom: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; width: 100%; }
    .header-meta { min-width: 0; margin-top: 16px; }
    .company-header { display: flex; align-items: center; justify-content: flex-end; flex: 1; min-width: 0; }
    .company-logo-wrap { height: 120px; max-width: 320px; display: flex; align-items: center; flex-shrink: 0; }
    .company-logo { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: left center; display: block; }
    .title { font-size: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin: 0; }
    .accent { margin-top: 12px; width: 84px; height: 6px; border-radius: 999px; background: #0ea5e9; }
    .meta { margin-top: 16px; font-size: 12px; color: #4b5563; line-height: 1.8; }
    .meta strong { color: #111827; font-size: 13px; }
    .section-title { font-size: 19px; font-weight: 800; border-left: 4px solid #0ea5e9; padding-left: 10px; margin: 0 0 12px; }
    .work-text { white-space: pre-wrap; color: #374151; line-height: 1.7; font-size: 13px; margin-bottom: 24px; }
    .photos-wrap { border-top: 1px solid #f3f4f6; padding-top: 18px; }
    .photos-title { font-size: 18px; font-weight: 800; margin: 0 0 12px; color: #111827; }
    .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .photo-card { overflow: hidden; min-height: 160px; }
    .photo-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="content">
      <div class="header">
        <h1 class="title">Work Progress Report</h1>
        <div class="accent"></div>
        <div class="header-row">
          <div class="meta header-meta">
            <div>PROJECT: <strong>${escapeHtml(payload.advance.projectName || "—")}</strong></div>
            <div>DATE: <strong>${escapeHtml(formattedDate)}</strong></div>
            <div>CLIENT: <strong>${escapeHtml(payload.client.name || "—")}</strong></div>
            <div>PHONE: <strong>${escapeHtml(payload.client.phone || "—")}</strong></div>
            <div>LOCATION: <strong>${escapeHtml(payload.advance.location || "—")}</strong></div>
          </div>
          ${
            payload.company.logo
              ? `<div class="company-header">
          <div class="company-logo-wrap">
            <img src="${escapeHtml(payload.company.logo)}" alt="Company Logo" class="company-logo" />
          </div>
        </div>`
              : ""
          }
        </div>
      </div>
      <section>
        <h2 class="section-title">Work Completed</h2>
        <p class="work-text">${escapeHtml(payload.advance.workCompleted || "No work details added yet.")}</p>
      </section>
      ${
        payload.attachments.length > 0
          ? `
      <section class="photos-wrap">
        <h3 class="photos-title">Site Photos</h3>
        <div class="photos-grid">${photosHtml}</div>
      </section>
      `
          : ""
      }
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
