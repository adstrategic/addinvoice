<!-- 4b3f8a8a-06fb-46ad-999c-7c190cba9fcd 130d7da7-ac4b-44f0-9b62-ae937d960340 -->
# Migrate Invoice Creation Form to Feature Module

## Overview

Migrate invoice creation/editing from the standalone page to the invoices feature module. The form will render on the full page (replacing the list view) when creating or editing, use React Hook Form with Zod validation matching the backend schema, and include a product dialog for adding items individually via API.

**New Flow:**

1. User clicks "Create Invoice" → Business selection dialog opens (if multiple businesses)
2. User selects business → Invoice form shows (products section hidden)
3. User fills header data and selects client → Clicks "Save Invoice"
4. Invoice is created → Form switches to edit mode → Products section becomes visible
5. User can add products via dialog → Each product saves individually via API

## Current State Analysis

**Current:**

- `/frontend/app/invoices/new/page.tsx` - 1547 lines, all logic in one file
- Uses `useState` for form management
- Uses localStorage for data persistence
- Inline item management (add/remove items in state)
- Manual calculations
- No proper validation
- Template selection dialog

**Target:**

- Form in `frontend/features/invoices/forms/` folder
- React Hook Form with Zod validation
- API integration (replace localStorage)
- Product dialog for adding items
- Form manager hook (like `useClientManager`)
- Conditional field rendering based on `taxMode` and `discountType`
- Full-page form that replaces list view when active

## Implementation Plan

### 1. Create Frontend Schema File

**File:** `frontend/features/invoices/schema/invoices.schema.ts`

- Create Zod schemas matching backend `invoices.schemas.ts`
- Define `createInvoiceSchema` with all refinements
- Define `updateInvoiceSchema` (partial)
- Define `createInvoiceItemSchema` for product dialog
- Export TypeScript types: `CreateInvoiceDto`, `UpdateInvoiceDto`, `CreateInvoiceItemDto`

**Key Fields:**

- Header: `invoiceNumber`, `issueDate`, `dueDate`, `purchaseOrder`, `customHeader`, `clientId`
- General Settings: `currency`, `discount`, `discountType`, `taxMode`, `taxName`, `taxPercentage`
- Items: array of items with all fields
- Additional: `notes`, `terms`

**Conditional Validation:**

- `taxMode = BY_TOTAL` → `taxName` and `taxPercentage` required
- `taxMode != BY_TOTAL` → `taxName` and `taxPercentage` should be null
- `discountType != "none"` → `discount` must be > 0

### 2. Create Form Manager Hook

**File:** `frontend/features/invoices/hooks/useInvoiceFormManager.ts`

- Similar to `useClientManager` but for invoices
- State: `mode` ("create" | "edit"), `invoiceId` (for edit mode), `isFormOpen`
- Use `useInvoiceById` hook when in edit mode
- React Hook Form setup with `useForm` and Zod resolver
- Transform API response to form format
- Handle form submission (create/update via `useInvoiceActions`)
- Methods: `openCreate()`, `openEdit(id)`, `close()`, `onSubmit`

**Form State Management:**

- When `isFormOpen = true`, form replaces list view
- When `isFormOpen = false`, show list view

### 3. Create Product/Item Dialog Component

**File:** `frontend/features/invoices/forms/InvoiceItemDialog.tsx`

- Dialog component for adding/editing invoice items
- Form fields matching schema:
- `name` (required, with search icon for catalog lookup)
- `description` (required, textarea with 0/1400 char counter)
- `unitPrice` (required, number)
- `quantity` (required, number, default: 1)
- `quantityUnit` (required, select: DAYS, HOURS, UNITS)
- `discountType` (required, select: NONE, PERCENTAGE, FIXED)
- `discount` (required when discountType != NONE, number)
- Tax field (conditional):
- If `Invoice.taxMode = BY_PRODUCT`: Show `tax` percentage field
- If `Invoice.taxMode = BY_TOTAL`: Show `vatEnabled` checkbox
- If `Invoice.taxMode = NONE`: Hide tax field
- `saveToCatalog` (toggle switch)

- Props: `open`, `onOpenChange`, `invoiceTaxMode`, `invoiceTaxPercentage`, `onSubmit`, `initialData?` (for edit)
- On submit: Call API `addInvoiceItem` or `updateInvoiceItem`
- After successful submit: Close dialog and trigger invoice recalculation

### 4. Create Main Invoice Form Component

**File:** `frontend/features/invoices/forms/InvoiceForm.tsx`

- Main form component using React Hook Form
- Sections matching schema_doc.md flow:

1. **Header Section**: Invoice number, issue date, due date, purchase order, custom header
2. **Client Section**: Client selector (use clients API), display selected client info
3. **Products Section**: List of items with "Add Product" button, item cards with edit/delete
4. **General Settings Section**: 

- Discount (type selector + amount)
- Tax Mode (BY_PRODUCT, BY_TOTAL, NONE)
- Tax fields (conditional based on taxMode)

5. **Additional Info Section**: Notes, terms
6. **Payments Section**: List payments, add payment button (future)

- Use `InvoiceItemDialog` for adding/editing items
- Display calculated totals (subtotal, discount, tax, total)
- Form actions: Save Draft, Send Invoice, Cancel (back to list)

### 5. Create Form Field Components

**Files:**

- `frontend/features/invoices/forms/form-fields/InvoiceHeaderFields.tsx`
- `frontend/features/invoices/forms/form-fields/ClientSelectorFields.tsx`
- `frontend/features/invoices/forms/form-fields/InvoiceItemsFields.tsx`
- `frontend/features/invoices/forms/form-fields/GeneralSettingsFields.tsx`
- `frontend/features/invoices/forms/form-fields/AdditionalInfoFields.tsx`

- Extract form sections into reusable field components
- Use `FormField` from `@/components/ui/form`
- Handle conditional rendering (tax fields, discount fields)

### 6. Update InvoicesContent Component

**File:** `frontend/features/invoices/components/InvoicesContent.tsx`

- Add state management for form mode
- Use `useInvoiceFormManager` hook
- Conditional rendering:
- If `isFormOpen`: Render `InvoiceForm` (full page, replace list)
- If `!isFormOpen`: Render current list view
- Update `InvoiceActions` to call `formManager.openCreate()` instead of router.push
- Update `InvoiceCard` edit action to call `formManager.openEdit(id)`

**Navigation:**

- Remove router.push to `/invoices/new` and `/invoices/[id]/edit`
- Use state-based navigation within same component

### 7. Create Invoice Items List Component

**File:** `frontend/features/invoices/forms/InvoiceItemsList.tsx`

- Display list of invoice items
- Each item shows: name, quantity, unit price, discount, tax, total
- Actions: Edit (opens dialog), Delete (calls API)
- "Add Product" button opens `InvoiceItemDialog`
- Re-fetch invoice after item add/update/delete to get recalculated totals

### 8. Update Service Layer

**File:** `frontend/features/invoices/service/invoices.service.ts`

- Already has `addItem`, `updateItem`, `deleteItem` methods
- Ensure methods return updated invoice with recalculated totals
- Add error handling

### 9. Update Hooks

**File:** `frontend/features/invoices/hooks/useInvoices.ts`

- Ensure `useInvoiceById` includes items and payments
- Add invalidation after item operations

### 10. Verify and Use ClientSelector Component

**Files to Check:**

- `frontend/components/shared/ClientSelector.tsx` - Already exists
- `frontend/components/shared/hooks/useClientSelector.ts` - Already exists

**Verification Tasks:**

- Verify `useClientSelector` hook is compatible with current `useClients` hook signature
- Check that `isFetched` is available from `useQuery` return (should be available)
- Verify `initialData` structure matches `ApiSuccessResponse<ClientResponse[]>` format
- Test that debounced search works correctly

**Integration:**

- Use `ClientSelector` component in `ClientSelectorFields.tsx` form field component
- Pass `initialClient` from invoice data when in edit mode
- Connect to React Hook Form's `FormField` for `clientId` field
- Update label from "Customer *" to "Client *" if needed for consistency
- When client is selected, the form should use the `clientId` value (not populate other fields, as client data comes from API)

### 11. Remove Old Files

- Delete `/frontend/app/invoices/new/page.tsx`
- Delete `/frontend/app/invoices/[id]/edit/page.tsx` (if exists)
- Update any links/routes that reference these pages

### 12. Update Index Exports

**File:** `frontend/features/invoices/index.ts`

- Export form components, hooks, schemas
- Export `InvoiceForm`, `InvoiceItemDialog`, `useInvoiceFormManager`

## Key Implementation Details

### Conditional Field Rendering

**Tax Fields:**

- Watch `taxMode` field in form
- If `BY_PRODUCT`: Show `tax` percentage in item dialog
- If `BY_TOTAL`: Show `vatEnabled` checkbox in item dialog
- If `NONE`: Hide tax fields

**Discount Fields:**

- Watch `discountType` field
- If `PERCENTAGE` or `FIXED`: Show and require `discount` amount
- If `NONE`: Hide discount field

### Item Management Flow

1. User clicks "Add Product" → Opens `InvoiceItemDialog`
2. User fills item form → Submits
3. Dialog calls `invoicesService.addItem(invoiceId, itemData)`
4. Backend calculates item total and updates invoice totals
5. Dialog closes, form re-fetches invoice to show updated totals
6. New item appears in items list

### Form Submission Flow

1. User fills form → Clicks "Save Draft" or "Send Invoice"
2. Form validates using Zod schema
3. Transform form data to API format
4. Call `invoicesService.create()` or `update()`
5. On success: Close form, show list view, refresh list
6. On error: Show error message, keep form open

### Edit Mode Flow

1. User clicks "Edit" on invoice card
2. `formManager.openEdit(invoiceId)` called
3. `useInvoiceById` fetches invoice with items/payments
4. Form populates with invoice data
5. User can edit any field, add/remove items
6. On save: Call `invoicesService.update()`

## Files to Create

1. `frontend/features/invoices/schema/invoices.schema.ts`
2. `frontend/features/invoices/hooks/useInvoiceFormManager.ts`
3. `frontend/features/invoices/forms/InvoiceForm.tsx`
4. `frontend/features/invoices/forms/InvoiceItemDialog.tsx`
5. `frontend/features/invoices/forms/InvoiceItemsList.tsx`
6. `frontend/features/invoices/forms/form-fields/InvoiceHeaderFields.tsx`
7. `frontend/features/invoices/forms/form-fields/ClientSelectorFields.tsx`
8. `frontend/features/invoices/forms/form-fields/InvoiceItemsFields.tsx`
9. `frontend/features/invoices/forms/form-fields/GeneralSettingsFields.tsx`
10. `frontend/features/invoices/forms/form-fields/AdditionalInfoFields.tsx`

## Files to Update

1. `frontend/features/invoices/components/InvoicesContent.tsx` - Add form state management
2. `frontend/features/invoices/components/InvoiceActions.tsx` - Update create button
3. `frontend/features/invoices/components/InvoiceCard.tsx` - Update edit button
4. `frontend/features/invoices/index.ts` - Export new components/hooks

## Files to Delete

1. `frontend/app/invoices/new/page.tsx`
2. `frontend/app/invoices/[id]/edit/page.tsx` (if exists)

## Dependencies

- Use `react-hook-form` with `@hookform/resolvers/zod`
- Use existing `@/components/ui/form` components
- Use `useClients` hook for client selection
- Use `useInvoiceActions` for create/update
- Use `invoicesService` for item operations
- Follow clients module patterns for consistency