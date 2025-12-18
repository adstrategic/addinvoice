<!-- d1ac6ad0-7280-4b54-a507-d53033b5a1a9 4b92328a-560f-452f-bb65-3ca72202f717 -->
# Refactor InvoiceForm with React Hook Form and Zod

## Overview

Refactor the InvoiceForm component to use react-hook-form with zod schemas, break it into modular sections, integrate with the API, and implement a two-phase form flow where users must save the invoice header before adding products.

## File Structure Changes

### New Directory Structure

```
frontend/features/invoices/
├── forms/
│   └── InvoiceForm.tsx (moved from components/)
├── form-fields/
│   ├── HeaderSection.tsx
│   ├── ClientSection.tsx
│   ├── ProductsSection.tsx
│   ├── DiscountsVATSection.tsx
│   ├── PaymentsSection.tsx
│   ├── NotesSection.tsx
│   └── TermsSection.tsx
├── schemas/
│   └── invoice.schema.ts (zod schemas)
└── components/
    └── ProductFormDialog.tsx (new - separate product form)
```

## Implementation Steps

### 1. Create Zod Schemas

**File:** `frontend/features/invoices/schemas/invoice.schema.ts`

Create zod schemas matching the backend schema:

- `invoiceHeaderSchema` - invoiceNumber, issueDate, dueDate, purchaseOrder, customHeader
- `clientSchema` - for client selection/creation (id or create new)
- `invoiceItemSchema` - name, description, quantity, quantityUnit, unitPrice, discount, discountType, tax/vatEnabled (conditional)
- `discountVATSchema` - discount, discountType, taxMode, taxName, taxPercentage (conditional)
- `paymentSchema` - amount, paymentMethod, transactionId, paidAt, details
- `notesTermsSchema` - notes, terms
- `invoiceCreateSchema` - combines header + client (for initial save)
- `invoiceUpdateSchema` - for updating invoice after creation
- `invoiceItemCreateSchema` - for creating individual items

### 2. Move and Refactor Main Form Component

**File:** `frontend/features/invoices/forms/InvoiceForm.tsx`

- Move from `components/InvoiceForm.tsx` to `forms/InvoiceForm.tsx`
- Set up react-hook-form with `useForm` hook
- Use zodResolver with schemas
- Manage form mode state: `"create" | "edit"`
- Track invoice ID after initial save
- Conditionally show/hide ProductsSection based on mode
- Integrate with `useCreateInvoice` and `useUpdateInvoice` hooks
- Use `useInvoiceById` to fetch invoice data after save
- Handle form submission for initial save (header + client only)
- Handle errors from API (field-level and root errors)

### 3. Create Form Field Sections

#### HeaderSection

**File:** `frontend/features/invoices/form-fields/HeaderSection.tsx`

- Invoice number input
- Issue date picker
- Due date picker
- Purchase order (optional)
- Custom header (optional)
- Uses react-hook-form Controller components

#### ClientSection

**File:** `frontend/features/invoices/form-fields/ClientSection.tsx`

- Client selector (dropdown of existing clients from API)
- OR create new client form (inline or dialog)
- Client fields: name, businessName, email, phone, address, nit
- Uses react-hook-form Controller for select
- Integrate with clients API (need to check if clients service exists)

#### ProductsSection

**File:** `frontend/features/invoices/form-fields/ProductsSection.tsx`

- Only visible when form is in "edit" mode (after initial save)
- Display list of existing invoice items
- "Add Product" button that opens ProductFormDialog
- Product list with edit/delete actions
- Calculate and display subtotal
- Refresh invoice data after product is added

#### DiscountsVATSection

**File:** `frontend/features/invoices/form-fields/DiscountsVATSection.tsx`

- Invoice-level discount: discountType selector (NONE, PERCENTAGE, FIXED)
- Discount amount input (conditional on discountType)
- Tax mode selector (NONE, BY_PRODUCT, BY_TOTAL)
- Tax name and tax percentage (conditional on taxMode = BY_TOTAL)
- Uses react-hook-form with conditional validation

#### PaymentsSection

**File:** `frontend/features/invoices/form-fields/PaymentsSection.tsx`

- List of payments
- Add payment button
- Payment form (inline or dialog)
- Payment fields: amount, paymentMethod, transactionId, paidAt, details
- Display payment total vs invoice total

#### NotesSection

**File:** `frontend/features/invoices/form-fields/NotesSection.tsx`

- Notes textarea
- Simple textarea with react-hook-form

#### TermsSection

**File:** `frontend/features/invoices/form-fields/TermsSection.tsx`

- Terms & conditions textarea
- Simple textarea with react-hook-form

### 4. Create Product Form Dialog

**File:** `frontend/features/invoices/components/ProductFormDialog.tsx`

- Separate form component for adding/editing invoice items
- Uses react-hook-form with zod validation
- Fields:
  - name (required)
  - description (required)
  - quantity (required, default: 1)
  - quantityUnit (required, selector: DAYS, HOURS, UNITS)
  - unitPrice (required)
  - discountType (required, selector: NONE, PERCENTAGE, FIXED)
  - discount (conditional, required when discountType != NONE)
  - tax field (conditional based on invoice.taxMode):
    - If BY_PRODUCT: tax percentage input
    - If BY_TOTAL: vatEnabled checkbox
    - If NONE: hidden
  - Save to catalog checkbox (optional)
- Submit handler:
  - Calls API to create invoice item
  - Handles field-level errors
  - Handles root/server errors
  - On success: closes dialog, refreshes invoice data
- Uses invoice ID from parent form context

### 5. API Integration

#### Update Invoice Service

**File:** `frontend/features/invoices/service/invoices.service.ts`

Add methods:

- `createInvoiceItem(invoiceId: number, dto: InvoiceItemCreateDTO)` - create single item
- `updateInvoiceItem(invoiceId: number, itemId: number, dto: InvoiceItemUpdateDTO)` - update item
- `deleteInvoiceItem(invoiceId: number, itemId: number)` - delete item
- `createPayment(invoiceId: number, dto: PaymentCreateDTO)` - create payment
- `updatePayment(paymentId: number, dto: PaymentUpdateDTO)` - update payment
- `deletePayment(paymentId: number)` - delete payment

#### Create Hooks for Items and Payments

**File:** `frontend/features/invoices/hooks/useInvoiceItems.ts` (new)

- `useCreateInvoiceItem()` - mutation for creating items
- `useUpdateInvoiceItem()` - mutation for updating items
- `useDeleteInvoiceItem()` - mutation for deleting items

**File:** `frontend/features/invoices/hooks/usePayments.ts` (new)

- `useCreatePayment()` - mutation for creating payments
- `useUpdatePayment()` - mutation for updating payments
- `useDeletePayment()` - mutation for deleting payments

### 6. Form Flow Implementation

#### Initial State (Create Mode)

- Form shows: HeaderSection, ClientSection, DiscountsVATSection, NotesSection, TermsSection
- ProductsSection is hidden
- PaymentsSection is hidden (or shown but empty)
- "Save Invoice" button visible
- Form validation: header + client required

#### After Initial Save

- Call `useCreateInvoice` mutation with header + client data
- On success:
  - Store returned invoice ID
  - Switch form mode to "edit"
  - Call `useInvoiceById` to fetch full invoice data
  - Populate form with fetched data
  - Show ProductsSection
  - Change "Save Invoice" to "Update Invoice" or show both buttons

#### Edit Mode

- All sections visible
- ProductsSection shows existing items
- "Add Product" button opens ProductFormDialog
- ProductFormDialog uses invoice ID from form state
- After product save: refresh invoice data to show new product
- Form can be updated with any changes

### 7. Error Handling

- Use react-hook-form's `setError` for field-level errors
- Display root errors in a separate error component
- API errors should be parsed and mapped to fields
- Server validation errors should show in corresponding fields
- Network/unknown errors show as root error

### 8. Update Imports

- Update `InvoicesContent.tsx` to import from `forms/InvoiceForm`
- Update `index.ts` to export from new locations
- Update any other files that import InvoiceForm

## Key Implementation Details

### Form State Management

- Use react-hook-form's `formState` for validation
- Track `invoiceId` in component state (null initially, set after create)
- Track `formMode` state: `"create" | "edit"`
- Use `watch` to conditionally show/hide fields based on taxMode, discountType

### Conditional Field Visibility

- ProductsSection: only visible when `formMode === "edit"`
- Tax fields: conditional on `taxMode` value
- Discount fields: conditional on `discountType` value
- Product tax field: conditional on invoice's `taxMode`

### Data Flow

1. User fills header + selects client
2. Clicks "Save Invoice" → creates invoice via API
3. Receives invoice ID + full invoice data
4. Form switches to edit mode
5. User can add products via ProductFormDialog
6. ProductFormDialog creates item via API
7. InvoiceForm refreshes data to show new product
8. User can continue editing invoice

### Validation Rules

- Header: invoiceNumber, issueDate, dueDate required
- Client: clientId required (either selected or created)
- Products: validated in ProductFormDialog
- Discount: if discountType != NONE, discount > 0 required
- Tax: if taxMode = BY_TOTAL, taxName and taxPercentage required

## Files to Create

1. `frontend/features/invoices/forms/InvoiceForm.tsx`
2. `frontend/features/invoices/form-fields/HeaderSection.tsx`
3. `frontend/features/invoices/form-fields/ClientSection.tsx`
4. `frontend/features/invoices/form-fields/ProductsSection.tsx`
5. `frontend/features/invoices/form-fields/DiscountsVATSection.tsx`
6. `frontend/features/invoices/form-fields/PaymentsSection.tsx`
7. `frontend/features/invoices/form-fields/NotesSection.tsx`
8. `frontend/features/invoices/form-fields/TermsSection.tsx`
9. `frontend/features/invoices/components/ProductFormDialog.tsx`
10. `frontend/features/invoices/schemas/invoice.schema.ts`
11. `frontend/features/invoices/hooks/useInvoiceItems.ts`
12. `frontend/features/invoices/hooks/usePayments.ts`

## Files to Modify

1. `frontend/features/invoices/service/invoices.service.ts` - add item and payment methods
2. `frontend/features/invoices/components/InvoicesContent.tsx` - update import path
3. `frontend/features/invoices/index.ts` - update exports

## Files to Remove

1. `frontend/features/invoices/components/InvoiceForm.tsx` - moved to forms/

## Dependencies to Add

- `react-hook-form` - form management
- `@hookform/resolvers` - zod resolver
- `zod` - schema validation

## Notes

- Product form is completely separate with its own validation and error handling
- Form mode switching happens automatically after initial save
- All API calls should use existing service pattern
- Error handling should be consistent across all form sections
- Conditional fields should use react-hook-form's `watch` for reactivity

### To-dos

- [ ] Create Zod schemas
- [ ] Move and refactor main form component
- [ ] Create form field sections
- [ ] Create ProductFormDialog
- [ ] API Integration
- [ ] Form flow implementation
- [ ] Error handling
- [ ] Update imports