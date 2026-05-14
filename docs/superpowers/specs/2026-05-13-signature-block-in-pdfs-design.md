# Signature Block in Estimate & Proposal PDFs

**Date:** 2026-05-13
**Scope:** `apps/backend` + `apps/pdf-service`

## Problem

Signature data (`fullName`, `signedAt`, `signatureImageUrl`) is already stored in the database for both accepted estimates and accepted proposals. However, it is never forwarded to the PDF service and never rendered in generated PDFs. Downloading the PDF of a signed document shows no evidence of the signature.

## Goal

When a document (estimate or proposal) has been signed, the generated PDF must include a signature block at the bottom of the last page showing:
1. The drawn signature image (if one was captured)
2. The signer's full name
3. The signed date

## What Is Already In Place (No New DB Work Needed)

- `Estimate.signatureData Json?` — stores `{ fullName, signedAt, signatureImageUrl? }`
- `Proposal.signatureData Json?` — same shape
- Both mappers (`estimates.mapper.ts`, `proposals.mapper.ts`) already expose `signatureData` on the response objects
- Signature upload to Cloudinary is already handled in the acceptance flow

## Changes Required

### Layer 1 — Backend Payload Builders

File: `apps/backend/src/features/estimates/estimates.service.ts`
Function: `buildEstimatePdfPayload()`

Add a `signature` field to the returned object:
```ts
signature: {
  fullName: string;
  signedAt: string;        // ISO string
  signatureImageUrl?: string;
} | null
```

Read from `estimate.signatureData` (cast from `unknown`). If `signatureData` is null/undefined or lacks `fullName`/`signedAt`, set `signature` to `null`.

File: `apps/backend/src/features/proposals/proposals.service.ts`
Function: `buildProposalPdfPayload()`

Same change — forward `proposal.signatureData` as a typed `signature` field on the `document` sub-object.

### Layer 2 — PDF Service Type Interfaces

File: `apps/pdf-service/src/estimate-html.ts`

Add to `EstimatePdfInvoice`:
```ts
signature?: {
  fullName: string;
  signedAt: string;
  signatureImageUrl?: string;
} | null;
```

File: `apps/pdf-service/src/proposal-html.ts`

Add to `ProposalPdfDocument`:
```ts
signature?: {
  fullName: string;
  signedAt: string;
  signatureImageUrl?: string;
} | null;
```

### Layer 3 — HTML Templates

**Placement:** A signature block is appended at the very bottom of the page body content, after the notes/terms section. It naturally lands at the end of the last page via normal document flow — no CSS `@page` tricks.

**Render condition:** Only rendered when `signature` is non-null.

**Layout:**
```
ACCEPTED BY                         ← small gray uppercase label

[drawn signature image if present]  ← <img> max-width ~200px

─────────────────────────           ← thin divider line

John Doe                            ← fullName, bold
Signed: Jan 15, 2024                ← formatted signedAt
```

Apply to both `buildEstimateHtml()` and `buildProposalHtml()`.

CSS classes needed (add to each template's `<style>` block):
- `.signature-section` — top border, margin-top, padding-top
- `.signature-label` — small gray uppercase text
- `.signature-image` — max-width 200px, display block, margin-bottom
- `.signature-line` — thin border-bottom divider under the image
- `.signature-name` — bold, font-size 12px
- `.signature-date` — gray, font-size 11px

## Acceptance Criteria

- Downloading the PDF of an unsigned estimate/proposal: no signature block appears
- Downloading the PDF of a signed estimate/proposal:
  - If a drawn signature image was captured: image shows above the name line
  - Signer's full name appears below the image (or directly if no image)
  - Signed date appears below the name, formatted as "Signed: Jan 15, 2024"
- Works for both estimate PDFs and proposal PDFs
- Works for all four PDF routes:
  - `GET /estimates/:sequence/pdf` (authenticated)
  - `GET /public/estimates/accept/:token/pdf` (public)
  - `GET /proposals/:sequence/pdf` (authenticated)
  - `GET /public/proposals/accept/:token/pdf` (public)
- Date format uses the existing `formatDate()` helper pattern: `"Jan 15, 2024"`, displayed as `"Signed: Jan 15, 2024"`
