# Database Schema Documentation

This document describes the database schema for the invoice management system, focusing on the invoice creation workflow and how fields are conditionally used based on user selections.

## Table of Contents
- [Enums](#enums)
- [Workspace](#workspace)
- [Client](#client)
- [Invoice](#invoice)
- [InvoiceItem](#invoiceitem)
- [Payment](#payment)
- [Catalog](#catalog)
- [Invoice Creation Flow](#invoice-creation-flow)

---

## Enums

### InvoiceStatus
- `DRAFT` - Invoice is being created/edited
- `SENT` - Invoice has been sent to client
- `VIEWED` - Client has viewed the invoice
- `PAID` - Invoice has been fully paid
- `OVERDUE` - Invoice is past due date

### TaxMode
- `BY_PRODUCT` - Tax is calculated per product/item
- `BY_TOTAL` - Tax is calculated on total (applied to items with VAT enabled)
- `NONE` - No tax applied

### QuantityUnit
- `DAYS` - Quantity measured in days
- `HOURS` - Quantity measured in hours
- `UNITS` - Default unit (standard quantity)

### DiscountType
- `PERCENTAGE` - Discount is a percentage
- `FIXED` - Discount is a fixed amount
- `NONE` - No discount applied

---

## Workspace

Represents a user's workspace/company. Contains business information and default settings for invoices.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `clerkId` | String | Yes | Unique Clerk user ID (replaces separate User table) |
| `name` | String | Yes | Company/Workspace name |
| `companyName` | String? | No | Full company name for invoices |
| `companyAddress` | String? | No | Company address for invoice footer |
| `companyPhone` | String? | No | Business phone |
| `companyEmail` | String? | No | Business email |
| `companyTaxId` | String? | No | Tax ID for invoices |
| `companyLogo` | String? | No | Logo URL for branded invoices |
| `invoiceNumberPrefix` | String? | No | Prefix for invoice numbers (default: "INV-") |
| `defaultCurrency` | String? | No | Default currency (default: "USD") |
| `defaultPaymentTerms` | String? | No | Default payment terms (e.g., "Net 30") |
| `defaultTaxRate` | Decimal? | No | Default tax percentage |
| `invoiceFooterText` | String? | No | Custom footer text for invoices |
| `invoiceColor` | String? | No | Brand color for invoices |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `deletedAt` | DateTime? | No | Soft delete timestamp |

### Relations
- `clients` - One-to-many with Client
- `invoices` - One-to-many with Invoice
- `payments` - One-to-many with Payment
- `catalogs` - One-to-many with Catalog

---

## Client

Represents a client/customer that can receive invoices.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `workspaceId` | Int | Yes | Foreign key to Workspace |
| `name` | String | Yes | Client name |
| `email` | String | Yes | Client email |
| `phone` | String | Yes | Client phone |
| `address` | String | Yes | Client address |
| `nit` | String | Yes | Client tax ID (NIT) |
| `businessName` | String | Yes | Client business name |
| `sequence` | Int | Yes | Sequence number for ordering (unique per workspace) |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `deletedAt` | DateTime? | No | Soft delete timestamp |

### Relations
- `workspace` - Many-to-one with Workspace
- `invoices` - One-to-many with Invoice

### Constraints
- Unique constraint on `[workspaceId, sequence]` - ensures unique sequence per workspace

---

## Invoice

Main invoice record. Contains header information, totals, and tax configuration.

### Fields

#### Header Information (Step 1 of Invoice Creation)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `workspaceId` | Int | Yes | Foreign key to Workspace |
| `clientId` | Int | Yes | Foreign key to Client (created/selected in Step 2) |
| `invoiceNumber` | String | Yes | Invoice number (filled in Step 1) |
| `status` | InvoiceStatus | Yes | Current status (default: DRAFT) |
| `issueDate` | DateTime | Yes | Invoice issue date (filled in Step 1) |
| `dueDate` | DateTime | Yes | Invoice due date (filled in Step 1) |
| `purchaseOrder` | String? | No | Optional purchase order number (filled in Step 1) |
| `customHeader` | String? | No | Optional custom header with work details (filled in Step 1) |

#### Financial Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currency` | String | Yes | Currency code (default: "USD") |
| `subtotal` | Decimal | Yes | Subtotal before tax and discount (calculated) |
| `totalTax` | Decimal | Yes | Total tax amount (calculated) |
| `discount` | Decimal | Yes | Invoice-level discount amount (filled in general settings) |
| `discountType` | String? | No | Invoice-level discount type: "percentage" or "fixed" (filled in general settings) |
| `total` | Decimal | Yes | Final total amount (calculated) |

#### Tax Configuration (General Settings)

**IMPORTANT:** These fields are conditionally used based on `taxMode`:

| Field | Type | Required | When Used | Description |
|-------|------|----------|-----------|-------------|
| `taxMode` | TaxMode | Yes | Always | Tax calculation mode (default: NONE) |
| `taxName` | String? | No | When `taxMode = BY_TOTAL` | Tax name (e.g., "VAT", "Sales Tax") |
| `taxPercentage` | Decimal? | No | When `taxMode = BY_TOTAL` | Tax percentage to apply |

**Tax Mode Behavior:**
- **`taxMode = NONE`**: No tax fields shown/used
- **`taxMode = BY_PRODUCT`**: Each InvoiceItem uses its own `tax` percentage field
- **`taxMode = BY_TOTAL`**: 
  - `taxName` and `taxPercentage` are required
  - Tax is applied to items where `InvoiceItem.vatEnabled = true`
  - Tax calculation: applies `taxPercentage` to each item with `vatEnabled = true`

#### Additional Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | String? | No | Invoice notes |
| `terms` | String? | No | Payment terms |
| `paymentLink` | String? | No | Payment link URL |
| `paymentProvider` | String? | No | Payment provider (e.g., "stripe", "paypal") |
| `sentAt` | DateTime? | No | When invoice was sent |
| `viewedAt` | DateTime? | No | When invoice was viewed by client |
| `paidAt` | DateTime? | No | When invoice was fully paid |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `deletedAt` | DateTime? | No | Soft delete timestamp |

### Relations
- `workspace` - Many-to-one with Workspace
- `client` - Many-to-one with Client
- `items` - One-to-many with InvoiceItem
- `payments` - One-to-many with Payment

### Constraints
- Unique constraint on `[workspaceId, invoiceNumber]` - ensures unique invoice numbers per workspace

---

## InvoiceItem

Represents a line item/product/service on an invoice. Created in Step 3 of invoice creation.

### Fields

#### Basic Product Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `invoiceId` | Int | Yes | Foreign key to Invoice |
| `name` | String | Yes | Product/service name (filled in Step 3) |
| `description` | String | Yes | Product description (filled in Step 3) |
| `quantity` | Decimal | Yes | Quantity (default: 1, filled in Step 3) |
| `quantityUnit` | QuantityUnit | Yes | Unit type: DAYS, HOURS, or UNITS (default: UNITS, filled in Step 3) |
| `unitPrice` | Decimal | Yes | Price per unit (filled in Step 3) |

#### Discount Fields (Item-Level)

**IMPORTANT:** Discount is applied AFTER calculating `quantity × unitPrice`

| Field | Type | Required | When Used | Description |
|-------|------|----------|-----------|-------------|
| `discount` | Decimal | Yes | When `discountType != NONE` | Discount amount (filled in Step 3) |
| `discountType` | DiscountType | Yes | Always | Discount type: PERCENTAGE, FIXED, or NONE (default: NONE) |

**Discount Behavior:**
- If `discountType = NONE`: No discount applied, `discount` should be 0
- If `discountType = PERCENTAGE`: `discount` contains the percentage value
- If `discountType = FIXED`: `discount` contains the fixed amount

#### Tax Fields (Conditional Based on Invoice Tax Mode)

**IMPORTANT:** These fields behave differently based on `Invoice.taxMode`:

| Field | Type | Required | When Used | Description |
|-------|------|----------|-----------|-------------|
| `tax` | Decimal | Yes | When `Invoice.taxMode = BY_PRODUCT` | Tax percentage for this item (filled in Step 3) |
| `vatEnabled` | Boolean | Yes | When `Invoice.taxMode = BY_TOTAL` | Checkbox indicating if VAT applies (filled in Step 3) |

**Tax Field Behavior by Invoice Tax Mode:**

1. **`Invoice.taxMode = NONE`**:
   - Neither `tax` nor `vatEnabled` are shown/used
   - `tax` defaults to 0, `vatEnabled` defaults to false

2. **`Invoice.taxMode = BY_PRODUCT`**:
   - `tax` field is shown as a percentage input (replaces VAT checkbox)
   - `vatEnabled` is not used (remains false)
   - Tax is calculated on item total AFTER item discount: `(quantity × unitPrice - itemDiscount) × (tax / 100)`

3. **`Invoice.taxMode = BY_TOTAL`**:
   - `vatEnabled` checkbox is shown (replaces tax percentage field)
   - `tax` is not used (remains 0)
   - If `vatEnabled = true`, the invoice-level `taxPercentage` is applied to this item
   - Tax calculation uses `Invoice.taxPercentage` on items where `vatEnabled = true`

#### Additional Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | Decimal | Yes | Calculated total for this item (after discount and tax) |
| `catalogId` | Int? | No | Foreign key to Catalog if item was saved/created from catalog |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

### Relations
- `invoice` - Many-to-one with Invoice
- `catalog` - Many-to-one with Catalog (optional)

### Calculation Logic

**Item Total Calculation:**
1. Base amount: `quantity × unitPrice`
2. Apply item discount:
   - If `discountType = PERCENTAGE`: `baseAmount - (baseAmount × discount / 100)`
   - If `discountType = FIXED`: `baseAmount - discount`
   - If `discountType = NONE`: `baseAmount`
3. Apply tax (based on `Invoice.taxMode`):
   - If `taxMode = BY_PRODUCT`: `itemTotal × (tax / 100)`
   - If `taxMode = BY_TOTAL` and `vatEnabled = true`: `itemTotal × (Invoice.taxPercentage / 100)`
   - Otherwise: no tax
4. Final item total: `itemTotalAfterDiscount + taxAmount`

---

## Payment

Represents a payment made towards an invoice. Can be added manually or automatically (via payment providers).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `workspaceId` | Int | Yes | Foreign key to Workspace |
| `invoiceId` | Int | Yes | Foreign key to Invoice |
| `amount` | Decimal | Yes | Payment amount (filled by user) |
| `paymentMethod` | String | Yes | Payment method (filled by user): "cash", "bank_transfer", "check", "stripe", "paypal", etc. |
| `transactionId` | String | Yes | Unique transaction ID (required, must be unique) |
| `details` | String? | No | Optional payment notes/details (filled by user) |
| `paidAt` | DateTime | Yes | Payment date (filled by user, default: now) |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `deletedAt` | DateTime? | No | Soft delete timestamp |

### Relations
- `workspace` - Many-to-one with Workspace
- `invoice` - Many-to-one with Invoice

### Constraints
- Unique constraint on `transactionId` - ensures no duplicate transaction IDs

---

## Catalog

Represents a saved product/service that can be reused when creating invoice items.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Int | Yes | Primary key |
| `workspaceId` | Int | Yes | Foreign key to Workspace |
| `name` | String | Yes | Product/service name |
| `description` | String | Yes | Product description |
| `price` | Decimal | Yes | Default price |
| `quantityUnit` | QuantityUnit | Yes | Default quantity unit: DAYS, HOURS, or UNITS (default: DAYS) |
| `sequence` | Int | Yes | Sequence number for ordering (unique per workspace) |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `deletedAt` | DateTime? | No | Soft delete timestamp |

### Relations
- `workspace` - Many-to-one with Workspace
- `invoiceItems` - One-to-many with InvoiceItem

### Constraints
- Unique constraint on `[workspaceId, sequence]` - ensures unique sequence per workspace

### Usage
- When creating an InvoiceItem, user can check "Save to catalog"
- If catalog item with same name exists: link to existing catalog via `catalogId`
- If catalog item doesn't exist: create new catalog entry and link via `catalogId`
- Catalog provides defaults for `name`, `description`, `price`, and `quantityUnit` when creating invoice items
- **Note:** Tax is NOT saved in catalog because it depends on invoice-level tax settings

---

## Invoice Creation Flow

This section documents the step-by-step flow of creating an invoice and which fields are used at each stage.

### Step 1: Invoice Header Information

User fills in the invoice header:
- **`invoiceNumber`** (required) - Invoice number
- **`issueDate`** (required) - Issue date
- **`dueDate`** (required) - Due date
- **`purchaseOrder`** (optional) - Purchase order number
- **`customHeader`** (optional) - Custom header with work details

### Step 2: Client Selection/Creation

User creates or selects a client:
- Creates new Client or selects existing one
- **`clientId`** is set on Invoice

### Step 3: Product/Item Information

For each invoice item, user fills in:
- **`name`** (required) - Product/service name
- **`description`** (required) - Description
- **`price`** (required) - Unit price (maps to `unitPrice`)
- **`quantity`** (required) - Quantity
- **`quantityUnit`** (required) - Selector: DAYS, HOURS, or UNITS
  - If DAYS: invoice is for a product/service priced per day
  - If HOURS: invoice is for a product/service priced per hour
  - If UNITS: standard quantity
- **`discountType`** (required) - Selector: NONE, PERCENTAGE, or FIXED
  - If PERCENTAGE or FIXED: user must fill **`discount`** amount
  - Discount is applied AFTER `quantity × unitPrice`
- **Tax field** (conditional based on invoice tax mode):
  - If `Invoice.taxMode = BY_TOTAL`: Show **`vatEnabled`** checkbox
  - If `Invoice.taxMode = BY_PRODUCT`: Show **`tax`** percentage field
  - If `Invoice.taxMode = NONE`: No tax field shown
- **`catalogId`** (optional) - "Save to catalog" checkbox
  - If checked: link to existing catalog item or create new one

### Step 4: Invoice General Settings

User configures invoice-level settings:

#### Discount (Applied to Subtotal)
- **`discountType`** (required) - Selector: "none", "percentage", or "fixed"
  - If "percentage" or "fixed": user must fill **`discount`** amount
  - Applied to subtotal (sum of all item totals after item discounts)

#### Tax Configuration
- **`taxMode`** (required) - Selector: BY_PRODUCT, BY_TOTAL, or NONE

**If `taxMode = BY_TOTAL`:**
- **`taxName`** (required) - Tax name (e.g., "VAT", "Sales Tax")
- **`taxPercentage`** (required) - Tax percentage
- Tax is applied to items where `InvoiceItem.vatEnabled = true`
- Each item with `vatEnabled = true` gets `taxPercentage` applied

**If `taxMode = BY_PRODUCT`:**
- Each InvoiceItem uses its own **`tax`** percentage field
- Tax is calculated per item: `(itemTotalAfterDiscount) × (tax / 100)`

**If `taxMode = NONE`:**
- No tax fields shown or used

### Step 5: Additional Invoice Fields

User can optionally fill:
- **`notes`** - Invoice notes
- **`terms`** - Payment terms

### Step 6: Payments (Can be added anytime)

User can add payments to the invoice:
- **`amount`** (required) - Payment amount
- **`paymentMethod`** (required) - Payment method
- **`paidAt`** (required) - Payment date
- **`details`** (optional) - Payment notes
- **`transactionId`** (required, unique) - Transaction ID

---

## Validation Rules Summary

### Invoice Validation
- `taxMode = BY_TOTAL` → `taxName` and `taxPercentage` are required
- `taxMode = BY_PRODUCT` → `taxName` and `taxPercentage` should be null
- `taxMode = NONE` → `taxName` and `taxPercentage` should be null
- `discountType` is "percentage" or "fixed" → `discount` must be > 0

### InvoiceItem Validation
- `discountType != NONE` → `discount` must be > 0
- `Invoice.taxMode = BY_PRODUCT` → `tax` can be set (0-100), `vatEnabled` should be false
- `Invoice.taxMode = BY_TOTAL` → `vatEnabled` can be true/false, `tax` should be 0
- `Invoice.taxMode = NONE` → `tax` should be 0, `vatEnabled` should be false

### Payment Validation
- `transactionId` must be unique across all payments
- `amount` must be > 0

---

## Important Notes for Server Implementation

1. **Tax Calculation Order:**
   - Calculate item totals first (with item discounts)
   - Sum items to get subtotal
   - Apply invoice-level discount to subtotal
   - Apply tax based on `taxMode`

2. **Conditional Field Visibility:**
   - Frontend should show/hide fields based on `taxMode` and `discountType` selections
   - Backend should validate that fields are only set when their conditions are met

3. **Catalog Integration:**
   - When saving item to catalog, check if catalog item with same name exists
   - If exists: link via `catalogId`
   - If not: create new catalog entry, then link via `catalogId`

4. **Quantity Unit:**
   - `quantityUnit` is for display purposes only
   - Does not affect calculation logic
   - Used to show "per day", "per hour", or standard units in UI

