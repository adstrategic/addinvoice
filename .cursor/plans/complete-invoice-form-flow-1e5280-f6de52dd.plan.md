---
name: Complete Invoice Form Flow Integration
overview: ""
todos:
  - id: c5e3e231-aa2d-40b7-a4de-b6de2e04c9ff
    content: Modify useInvoiceFormManager.ts to switch to edit mode after create, set invoiceSequence, and keep form open
    status: pending
  - id: 35b9dc08-560d-43ff-9b2e-b8909419b0ef
    content: Remove duplicate logic from InvoiceForm.tsx and integrate with useInvoiceFormManager state
    status: pending
  - id: 1a31a483-145b-42d3-8011-ce7a0e4f614b
    content: Pass existingInvoice from invoiceManager to InvoiceForm component
    status: pending
  - id: a49dee40-4644-4756-a8eb-c26a491e0669
    content: Ensure product addition properly refreshes invoice data via query invalidation
    status: pending
  - id: d843a2ef-a3bc-4392-b57a-40d4c90323cd
    content: Confirm invoice schema excludes products from create/update operations
    status: pending
isProject: false
---

# Complete Invoice Form Flow Integration

## Overview

Complete the invoice form flow where:

1. User selects business → form opens in create mode (products hidden)
2. User fills header data → saves → invoice created → form switches to edit mode
3. Products section appears → user can add products via separate dialog
4. Products are saved independently and invoice re-renders
5. Invoice form submission excludes products

## Current State Analysis

**Files involved:**

- `InvoicesContent.tsx` - Main component, shows form when business selected
- `useInvoiceFormManager.ts` - Manages form state, business selection, and submission
- `InvoiceForm.tsx` - Form component with duplicate logic that needs integration
- `ProductsSection.tsx` - Already implemented, shows products in edit mode
- `ProductFormDialog.tsx` - Already implemented, handles product creation

**Issues identified:**

1. `InvoiceForm.tsx` has duplicate `handleInitialSave` and `handleUpdate` that aren't used
2. `useInvoiceFormManager.ts` closes form after create/update (should stay open)
3. `useInvoiceFormManager.ts` doesn't switch to edit mode after create
4. `InvoiceForm.tsx` uses local state instead of manager's state
5. Products section visibility logic needs proper integration

## Implementation Plan

### 1. Update `useInvoiceFormManager.ts`

**Location:** `frontend/features/invoices/hooks/useInvoiceFormManager.ts`

**Changes:**

- Modify `onSubmit` to handle create mode:
- After successful create, extract invoice sequence from response
- Set `invoiceSequence` state with the created invoice's sequence
- Switch `mode` to "edit" 
- Do NOT call `close()` - keep form open (user needs to add products)
- Modify edit mode handling:
- After successful update, call `close()` - form should close and return to list
- Ensure invoice data is refetched before closing
- Add logic to extract sequence from create response (check response structure)

### 2. Update `InvoiceForm.tsx`

**Location:** `frontend/features/invoices/forms/InvoiceForm.tsx`

**Changes:**

- Remove duplicate `handleInitialSave` and `handleUpdate` functions (lines 61-133)
- Remove local `invoiceId`, `formMode`, and `invoiceData` state (lines 50-56)
- Use `mode` prop from parent instead of local `formMode`
- Use `existingInvoice` from `useInvoiceFormManager` via props (need to pass it)
- Update ProductsSection visibility: show only when `mode === "edit"` AND `existingInvoice` exists
- Update ProductsSection props to use `existingInvoice.id` and `existingInvoice.items`
- Update `handleItemAdded` to properly refresh invoice data using the manager's refetch mechanism
- Remove unused imports (`useState`, `useCreateInvoice`, `useUpdateInvoice`, `useInvoiceBySequence`)

### 3. Update `InvoicesContent.tsx`

**Location:** `frontend/features/invoices/components/InvoicesContent.tsx`

**Changes:**

- Pass `existingInvoice` from `invoiceManager` to `InvoiceForm` component
- Ensure `invoiceManager.invoice` (which is `existingInvoice`) is passed as a prop

### 4. Verify Product Refresh Flow

**Location:** `frontend/features/invoices/forms/form-fields/ProductsSection.tsx`

**Verification:**

- Ensure `onItemAdded` callback properly invalidates queries
- Verify that `useInvoiceBySequence` in manager will refetch when sequence is set
- Confirm ProductsSection receives updated `items` prop after product creation

### 5. Ensure Invoice Form Submission Excludes Products

**Location:** `frontend/features/invoices/schemas/invoice.schema.ts`

**Verification:**

- Confirm `createInvoiceSchema` does NOT include products/items field
- Verify API calls in `invoices.service.ts` don't send products in create/update

## Key Integration Points

1. **Mode Transition:** Create → Edit happens in `useInvoiceFormManager.onSubmit` after successful create
2. **Invoice Data:** Fetched via `useInvoiceBySequence` hook when `mode === "edit"` and `invoiceSequence` is set
3. **Products Visibility:** Controlled by `mode === "edit"` AND `existingInvoice !== null`
4. **Product Refresh:** When product is added, `onItemAdded` invalidates queries, triggering `useInvoiceBySequence` to refetch
5. **Form Persistence:** 

- After CREATE: Form stays open (user needs to add products)
- After UPDATE (edit mode): Form closes and returns to invoice list

## Testing Checklist

- [ ] Business selection dialog opens when clicking "Create Invoice"
- [ ] Form opens in create mode with products section hidden
- [ ] After saving header data, form switches to edit mode
- [ ] Products section appears after switching to edit mode
- [ ] "Add Product" button opens ProductFormDialog
- [ ] Product submission saves to DB and invoice re-renders with new product
- [ ] Invoice form submission (update) does not include products
- [ ] Form stays open after create (to allow adding products)
- [ ] Form closes after update in edit mode (returns to invoice list)
- [ ] Invoice data refreshes correctly after product addition