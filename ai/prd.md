# Product Requirements Document: Invoice SaaS Platform

## Constraints & Assumptions

- **Single-tenant per workspace model**: Users belong to workspaces. Multi-organization SaaS scaling is deferred to future work.
- **Payment processing**: Stripe and PayPal hosted checkout only. MVP does not store raw card numbers.
- **Mobile support**: Responsive web app required; dedicated mobile apps are out of scope for MVP.
- **Database**: PostgreSQL as the single source of truth.
- **UI preservation**: Visual design remains unchanged; only frontend architecture will be refactored for scalability and maintainability.
- **Architecture pattern**: Vertical slice architecture required for all features.

---

## Executive Summary

AddInvoice is a SaaS invoice management platform designed for small businesses, contractors, and freelancers to create, send, and track invoices and estimates efficiently. The platform enables fast invoice creation with templates, automated payment reminders, hosted payment links via Stripe and PayPal, and comprehensive tracking through a mobile-friendly interface. The primary value propositions are: reducing invoice creation time from hours to minutes, improving payment collection rates through automated reminders and one-click payment links, and providing real-time visibility into business cash flow through integrated reporting. The target audience includes independent freelancers, small contractors (1-5 employees), and agency administrators managing client billing.

---

## Primary Goals & Success Metrics

### Key Performance Indicators (KPIs)

1. **Time to create invoice**: Target < 3 minutes from login to send (baseline: measure median time in MVP)
2. **Conversion to paid plan**: Target 15% free-to-paid conversion within 90 days of signup
3. **Invoice paid rate**: Target 85% of sent invoices paid within 30 days
4. **Weekly Active Users (WAU)**: Target 60% of registered users active weekly
5. **Churn for paid customers**: Target < 5% monthly churn for paid tier

---

## User Personas

### 1. Freelancer (Primary Persona: Sarah, Graphic Designer)

**Needs:**

- Quick invoice creation after project completion
- Professional branding on invoices
- Track payment status and send reminders
- Simple expense tracking for tax purposes
- Mobile access to view invoices on-the-go

**Pain Points:**

- Invoicing takes too long and interrupts creative work
- Clients forget to pay without reminders
- No easy way to track which invoices are paid
- Manual PDF creation is time-consuming

**Frequency of Use:**

- Creates 5-10 invoices per month
- Checks invoice status 2-3 times per week
- Sends payment reminders weekly

---

### 2. Small Contractor (Primary Persona: Mike, Construction Contractor)

**Needs:**

- Create estimates that convert to invoices
- Track time and materials for accurate billing
- Multiple clients with recurring projects
- Expense tracking for materials and tools
- Payment links for faster client payments

**Pain Points:**

- Estimates and invoices are disconnected
- Time tracking is manual and error-prone
- Clients need multiple payment options
- No visibility into cash flow timing

**Frequency of Use:**

- Creates 15-20 invoices per month
- Daily usage for time/expense tracking
- Weekly review of payment status

---

### 3. Agency Admin (Primary Persona: Lisa, Agency Operations Manager)

**Needs:**

- Manage invoices for multiple team members
- Client contact management (CRM-like)
- Reporting for management and accounting
- Recurring invoices for retainer clients
- Bulk operations (send reminders, export data)

**Pain Points:**

- No team collaboration features
- Manual reporting takes hours
- Client data scattered across spreadsheets
- No automated recurring billing

**Frequency of Use:**

- Creates/manages 50+ invoices per month
- Daily dashboard review
- Weekly reporting and reconciliation

---

## Scope and Prioritized Feature List

### MVP (Must-Haves)

#### Core Invoice Management

- Create, edit, delete invoices (draft, sent, paid, overdue states)
- Invoice line items with quantity, unit price, tax, and discounts
- Tax calculation (percentage-based per line item and/or invoice-level)
- Discounts (percentage or fixed amount)
- Invoice numbering (auto-increment with workspace prefix)
- Issue date and due date management

#### Client Management

- CRUD operations for clients
- Client contact information (name, email, phone, address, tax ID)
- Client selection when creating invoices

#### Estimates

- Create estimates (similar structure to invoices)
- Convert estimates to invoices (one-click)
- Estimate numbering and expiration dates

#### PDF Export & Print

- Generate PDF from invoice/estimate data
- Print-friendly layout
- Include company logo and branding

#### Payment Integration

- Stripe hosted payment links (one-time checkout)
- PayPal hosted payment links
- Payment status webhook handling (Stripe/PayPal events)
- Payment link generation per invoice
- Record payment manually (for non-online payments)

#### Invoice Status Tracking

- Status: draft, sent, viewed, paid, overdue
- Track when invoice was sent and viewed (via email tracking pixel or link)
- Automatic overdue detection (based on due date)
- Payment date recording

#### Basic Reporting

- Income by period (monthly, quarterly, yearly)
- Invoice count by status
- Revenue summary (total, paid, pending, overdue)
- Simple dashboard with key metrics

#### Email Sending & Reminders

- Send invoice via email (SMTP integration)
- Email templates (invoice, reminder, payment confirmation)
- Payment reminder scheduling (manual and automated)
- Email tracking (open rates, link clicks)

#### Responsive UI

- Mobile-first design (works on phones, tablets, desktops)
- Touch-friendly interactions
- Responsive tables and forms

#### Authentication & User Workspace

- Clerk authentication (signup, login, password reset)
- User workspace (single workspace per user in MVP)
- User profile management
- Optional: Multi-organization support (future: user can belong to multiple workspaces)

---

### V2 (Near-Term)

- Time & expense tracking (timer, manual entry, project assignment)
- Convert estimates → invoices (one-click with item mapping)
- Invoice templates & branding (custom logo, colors, fonts)
- Attachments/photos (upload files to invoices)
- Client signature (digital signature collection)
- CSV import for clients and line items
- Multi-currency support (currency selection, exchange rates)
- Invoice recurrence & scheduled invoices (auto-generate recurring invoices)
- Webhooks for payment events (Stripe/PayPal webhook handlers)

---

### V3+ (Later)

- Team invites & roles (workspace collaboration, permissions)
- Multi-tenant billing (subscription management per workspace)
- Advanced accounting reports (P&L, balance sheets, tax reports)
- Bank sync (third-party integrations: Plaid, Yodlee)
- Advanced user roles (admin, accountant, viewer)
- Integrations (QuickBooks, Xero, Zapier)
- Offline mobile features (PWA with offline support)

---

## Detailed Vertical-Slice Implementation Approach

### MVP Vertical Slice: Create → Preview → Send Invoice → Record Payment

This vertical slice demonstrates end-to-end functionality across all layers:

**User Flow:**

1. User creates invoice (form with client, items, dates, tax)
2. User previews invoice (PDF preview)
3. User sends invoice via email (generates payment link)
4. Client views invoice and pays via payment link
5. Webhook updates invoice status to "paid"
6. User views updated invoice status in dashboard

**Implementation Layers:**

#### Frontend (Next.js Client-Side)

- `app/invoices/new/page.tsx`: Invoice creation form (react-hook-form + zod)
- `app/invoices/[id]/preview/page.tsx`: Invoice preview (PDF-ready view)
- `app/invoices/[id]/send/page.tsx`: Send invoice dialog (email + payment link)
- `hooks/useInvoices.ts`: TanStack Query hooks (useMutation for create, useQuery for fetch)
- `components/invoices/InvoiceForm.tsx`: Reusable form component
- `components/invoices/InvoicePreview.tsx`: Preview component
- `lib/api/invoices.ts`: API client functions

#### Backend (Express.js)

- `routes/api/v1/invoices.ts`: POST /api/v1/invoices (create)
- `routes/api/v1/invoices/:id.ts`: GET /api/v1/invoices/:id (preview data)
- `routes/api/v1/invoices/:id/send.ts`: POST /api/v1/invoices/:id/send (email + payment link)
- `routes/api/v1/payments/webhook.ts`: POST /api/v1/payments/webhook (Stripe/PayPal)
- `services/invoiceService.ts`: Business logic
- `services/emailService.ts`: Email sending (SMTP)
- `services/paymentService.ts`: Payment link generation (Stripe/PayPal)
- `middleware/auth.ts`: Clerk JWT verification

#### Database (Prisma + PostgreSQL)

- `prisma/schema.prisma`: Invoice, InvoiceItem, Client, Payment models
- Migrations: Initial schema + indexes

#### Validation

- `lib/validations/invoice.ts`: Zod schemas (shared client/server)
- Server: zod validation in route handlers
- Client: zodResolver with react-hook-form

#### Tests

- `tests/api/invoices.test.ts`: API integration tests
- `tests/services/invoiceService.test.ts`: Service unit tests
- `tests/components/InvoiceForm.test.tsx`: Component tests (React Testing Library)

**Success Criteria:**

- User can create invoice in < 3 minutes
- Invoice preview renders correctly
- Email sends successfully with payment link
- Payment webhook updates invoice status
- UI reflects payment status in real-time (TanStack Query cache invalidation)

---

## API Specification (Express REST)

### Base URL

`/api/v1`

### Authentication

All endpoints require `Authorization: Bearer <Clerk JWT>` header. Backend validates JWT via Clerk SDK.

### Endpoints

#### `GET /api/v1/invoices`

List invoices for authenticated user's workspace.

**Query Parameters:**

- `page` (optional, number, default: 1): Page number
- `limit` (optional, number, default: 20, max: 100): Items per page
- `status` (optional, string): Filter by status (draft, sent, paid, overdue)
- `clientId` (optional, string): Filter by client ID
- `fromDate` (optional, ISO date): Filter invoices from date
- `toDate` (optional, ISO date): Filter invoices to date

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "inv_123",
      "invoiceNumber": "INV-2024-001",
      "clientId": "client_456",
      "client": {
        "id": "client_456",
        "name": "Acme Corp",
        "email": "billing@acme.com"
      },
      "status": "sent",
      "issueDate": "2024-01-15",
      "dueDate": "2024-01-30",
      "subtotal": 1000.0,
      "totalTax": 100.0,
      "discount": 0.0,
      "total": 1100.0,
      "currency": "USD",
      "items": [
        {
          "id": "item_789",
          "description": "Web Development",
          "quantity": 10,
          "unitPrice": 100.0,
          "tax": 10,
          "total": 1100.0
        }
      ],
      "paymentLink": "https://checkout.stripe.com/pay/...",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing JWT
- `403 Forbidden`: User does not have access to workspace
- `500 Internal Server Error`: Server error

---

#### `POST /api/v1/invoices`

Create a new invoice.

**Request Body (zod schema reference: `CreateInvoiceSchema`):**

```json
{
  "clientId": "client_456",
  "issueDate": "2024-01-15",
  "dueDate": "2024-01-30",
  "currency": "USD",
  "items": [
    {
      "description": "Web Development",
      "quantity": 10,
      "unitPrice": 100.0,
      "tax": 10
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 5
  },
  "notes": "Payment due within 30 days",
  "terms": "Net 30"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "inv_123",
    "invoiceNumber": "INV-2024-001",
    "status": "draft",
    "total": 1045.0,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation error (zod schema failure)
- `401 Unauthorized`: Invalid JWT
- `404 Not Found`: Client not found
- `500 Internal Server Error`: Server error

---

#### `GET /api/v1/invoices/:id`

Get single invoice by ID.

**Response (200 OK):**
Same structure as list item, but single object (no pagination).

**Error Responses:**

- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Invoice belongs to different workspace
- `404 Not Found`: Invoice not found

---

#### `PATCH /api/v1/invoices/:id`

Update invoice (only if status is "draft").

**Request Body (zod schema: `UpdateInvoiceSchema`, partial):**

```json
{
  "dueDate": "2024-02-15",
  "items": [
    {
      "id": "item_789",
      "description": "Web Development (Updated)",
      "quantity": 12,
      "unitPrice": 100.0,
      "tax": 10
    }
  ]
}
```

**Response (200 OK):**
Updated invoice object.

**Error Responses:**

- `400 Bad Request`: Validation error or invoice not in draft status
- `403 Forbidden`: Invoice belongs to different workspace
- `404 Not Found`: Invoice not found

---

#### `DELETE /api/v1/invoices/:id`

Soft delete invoice (sets `deletedAt` timestamp).

**Response (204 No Content)**

**Error Responses:**

- `403 Forbidden`: Invoice belongs to different workspace
- `404 Not Found`: Invoice not found

---

#### `POST /api/v1/invoices/:id/send`

Send invoice via email and generate payment link.

**Request Body (zod schema: `SendInvoiceSchema`):**

```json
{
  "email": "billing@acme.com",
  "subject": "Invoice #INV-2024-001",
  "message": "Please find your invoice attached.",
  "paymentProvider": "stripe" // or "paypal"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "invoiceId": "inv_123",
    "emailSent": true,
    "paymentLink": "https://checkout.stripe.com/pay/...",
    "sentAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation error or invoice already sent
- `404 Not Found`: Invoice not found
- `500 Internal Server Error`: Email or payment link generation failed

---

#### `POST /api/v1/payments/webhook`

Webhook endpoint for Stripe and PayPal payment events.

**Request Headers:**

- `x-stripe-signature` or `x-paypal-signature`: Signature for verification

**Request Body:**
Provider-specific webhook payload (Stripe Event or PayPal Webhook).

**Response (200 OK):**

```json
{
  "received": true
}
```

**Error Responses:**

- `400 Bad Request`: Invalid webhook signature
- `500 Internal Server Error`: Webhook processing failed

**Note:** Implementation must verify webhook signatures and handle idempotency (prevent duplicate processing).

---

### Pagination Pattern

All list endpoints use cursor-based or offset-based pagination:

**Offset-based (recommended for MVP):**

```
GET /api/v1/invoices?page=1&limit=20
```

**Response includes:**

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Auth & Security Architecture

### Clerk Integration Pattern

#### Frontend (Next.js)

- **Page Protection**: Use Clerk middleware or HOC to protect routes

  ```typescript
  // middleware.ts or page component
  import { auth } from "@clerk/nextjs";

  export default async function ProtectedPage() {
    const { userId } = auth();
    if (!userId) redirect("/sign-in");
  }
  ```

- **Session Token Retrieval**: Get JWT token to send to Express backend

  ```typescript
  import { getAuth } from '@clerk/nextjs/server';

  const token = await getAuth({ ... });
  // Send token in Authorization header
  ```

- **API Client Setup**: Include token in all API requests
  ```typescript
  // lib/api/client.ts
  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  ```

#### Backend (Express.js)

- **JWT Verification Middleware**: Verify Clerk JWT on every request

  ```typescript
  // middleware/auth.ts
  import { clerkClient } from "@clerk/clerk-sdk-node";

  export async function verifyClerkToken(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = await clerkClient.verifyToken(token);
      req.user = payload; // { userId, orgId, ... }
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  }
  ```

- **Workspace Authorization**: Ensure user can only access their workspace data
  ```typescript
  // Middleware: check workspace access
  const workspace = await prisma.workspace.findFirst({
    where: { userId: req.user.userId },
  });
  if (!workspace) return res.status(403).json({ error: "Forbidden" });
  req.workspaceId = workspace.id;
  ```

### Security Best Practices

1. **Rate Limiting**: Use `express-rate-limit` (e.g., 100 requests per 15 minutes per IP)
2. **Input Sanitization**: All user inputs validated with zod schemas before processing
3. **Server-Side Authorization**: Always verify workspace ownership in database queries
4. **Payment Secrets**: Store Stripe/PayPal API keys in environment variables (never in code)
5. **CORS Policies**: Configure CORS to only allow Next.js frontend origin
6. **Secure File Uploads**: Validate file types, sizes, and scan for malware (use cloud storage: S3, Cloudinary)
7. **SQL Injection Prevention**: Use Prisma parameterized queries (never raw SQL with user input)
8. **XSS Prevention**: Sanitize user-generated content before rendering (escape HTML in emails)

---

## Client-Side Rules & Implementation Notes

### Forms with react-hook-form + zod

**Pattern:**

```typescript
// lib/validations/invoice.ts
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  issueDate: z.string().date(),
  dueDate: z.string().date(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    tax: z.number().min(0).max(100)
  })).min(1)
});

// components/invoices/InvoiceForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function InvoiceForm() {
  const form = useForm({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: { ... }
  });

  const onSubmit = async (data) => {
    await createInvoiceMutation.mutateAsync(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**All forms must:**

- Use zod schemas for validation (shared with backend)
- Use react-hook-form for form state management
- Show inline field errors (`formState.errors`)
- Disable submit button during mutation (`isSubmitting`)

---

### TanStack Query Patterns

#### Queries for Lists

```typescript
// hooks/useInvoices.ts
import { useQuery } from "@tanstack/react-query";

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => apiClient.getInvoices(filters),
    staleTime: 30000, // 30 seconds
  });
}
```

#### Queries for Single Resources

```typescript
export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => apiClient.getInvoice(id),
    enabled: !!id,
  });
}
```

#### Mutations with Optimistic Updates

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createInvoice,
    onMutate: async (newInvoice) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["invoices"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(["invoices"]);

      // Optimistically update
      queryClient.setQueryData(["invoices"], (old) => ({
        ...old,
        data: [newInvoice, ...old.data],
      }));

      return { previous };
    },
    onError: (err, newInvoice, context) => {
      // Rollback on error
      queryClient.setQueryData(["invoices"], context.previous);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
```

#### Background Refetch Intervals

```typescript
// For invoice status updates (polling)
export function useInvoiceStatus(id: string) {
  return useQuery({
    queryKey: ["invoices", id, "status"],
    queryFn: () => apiClient.getInvoiceStatus(id),
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
  });
}
```

#### Cache Key Scheme

- Lists: `['invoices', filters]`
- Single: `['invoices', id]`
- Status: `['invoices', id, 'status']`
- Clients: `['clients']`, `['clients', id]`

---

### File Structure (Next.js App Router)

```
app/
  (auth)/
    sign-in/
    sign-up/
  (dashboard)/
    layout.tsx              # Protected layout with Clerk
    page.tsx                # Dashboard
    invoices/
      page.tsx              # Invoice list
      new/
        page.tsx            # Create invoice
      [id]/
        page.tsx            # View invoice
        edit/
          page.tsx          # Edit invoice
        preview/
          page.tsx          # Preview before send
    clients/
      page.tsx
      [id]/
        page.tsx
  layout.tsx                # Root layout
  api/                      # Next.js API routes (if needed for proxy)

components/
  ui/                       # shadcn/ui components
  invoices/
    InvoiceForm.tsx
    InvoicePreview.tsx
    InvoiceList.tsx
    InvoiceCard.tsx
  clients/
    ClientForm.tsx
    ClientList.tsx
  layout/
    AppLayout.tsx
    Sidebar.tsx

hooks/
  useInvoices.ts            # TanStack Query hooks
  useClients.ts
  useAuth.ts                # Clerk auth hook wrapper
  use-toast.ts

lib/
  api/
    client.ts               # Axios/fetch client setup
    invoices.ts             # Invoice API functions
    clients.ts
  validations/
    invoice.ts              # Zod schemas (shared)
    client.ts
  utils.ts                  # cn(), etc.

services/                   # Client-side services (if needed)
  pdf.ts                    # PDF generation
  email.ts                  # Email preview/compose

types/
  invoice.ts
  client.ts
  api.ts                    # API response types
```

**Component Organization Principles:**

- **Feature-based folders**: Group by domain (invoices, clients)
- **Reusable components**: Extract common patterns (forms, cards, modals)
- **Separation of concerns**: UI components don't know about API calls (use hooks)
- **Avoid prop drilling**: Use TanStack Query hooks + server-returned data
- **Composable components**: Build complex UIs from small, focused components

---

### Performance Optimization Strategies

#### Render Control Patterns

```typescript
// Use React.memo for expensive list items
export const InvoiceCard = React.memo(({ invoice }) => {
  // ...
});

// Use useMemo for expensive calculations
const filteredInvoices = useMemo(() => {
  return invoices.filter(/* ... */);
}, [invoices, filters]);
```

#### Memoization Boundaries

- Memoize expensive components (lists, charts, PDF previews)
- Use `useMemo` for derived data (filtered lists, totals)
- Use `useCallback` for event handlers passed to memoized children

#### TanStack Query Cache Layer

- Set appropriate `staleTime` (30s for lists, 5m for single resources)
- Use `keepPreviousData: true` for pagination (smooth transitions)
- Implement optimistic updates for instant UI feedback

#### Pagination

- Server-side pagination (limit/offset)
- Infinite scroll or "Load More" button (use `useInfiniteQuery`)
- Virtual scrolling for very long lists (react-window or tanstack-virtual)

---

## Validation & Error Handling

### Server & Client Validation Mapping

**Shared Zod Schemas:**

```typescript
// lib/validations/invoice.ts (imported by both client and server)
export const createInvoiceSchema = z.object({ ... });
```

**Server Validation:**

```typescript
// routes/api/v1/invoices.ts
import { createInvoiceSchema } from "@/lib/validations/invoice";

export async function POST(req, res) {
  const result = createInvoiceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      issues: result.error.issues,
    });
  }
  // Process validated data
}
```

**Client Validation:**

```typescript
// react-hook-form automatically validates with zodResolver
const form = useForm({
  resolver: zodResolver(createInvoiceSchema),
});
```

### Error HTTP Codes Mapping

| Scenario                    | HTTP Code | Response Body                                   |
| --------------------------- | --------- | ----------------------------------------------- |
| Validation error            | 400       | `{ error: "Validation failed", issues: [...] }` |
| Unauthorized (no token)     | 401       | `{ error: "Unauthorized" }`                     |
| Forbidden (wrong workspace) | 403       | `{ error: "Forbidden" }`                        |
| Resource not found          | 404       | `{ error: "Not found" }`                        |
| Conflict (e.g., duplicate)  | 409       | `{ error: "Conflict", message: "..." }`         |
| Server error                | 500       | `{ error: "Internal server error" }`            |

### UX Error Patterns

**Inline Field Errors:**

```typescript
// Show field-level errors from react-hook-form
<Input {...form.register("clientId")} />;
{
  form.formState.errors.clientId && (
    <p className="text-sm text-destructive">
      {form.formState.errors.clientId.message}
    </p>
  );
}
```

**Toast Notifications:**

```typescript
// For API errors (mutation failures)
const mutation = useMutation({
  mutationFn: apiClient.createInvoice,
  onError: (error) => {
    toast({
      title: "Error",
      description: error.response?.data?.error || "Failed to create invoice",
      variant: "destructive",
    });
  },
});
```

**Form-Level Errors:**

```typescript
// Show general form errors (non-field-specific)
{
  form.formState.errors.root && (
    <Alert variant="destructive">{form.formState.errors.root.message}</Alert>
  );
}
```

---

## Acceptance Criteria & Milestones

### 6-8 Week MVP Delivery Plan

#### Week 1: Foundation & Auth

**Sprint Goal:** Set up project structure, authentication, and database schema.

**Tasks:**

- [ ] Initialize Express backend with TypeScript
- [ ] Set up Prisma schema (User, Workspace, Client, Invoice, InvoiceItem, Payment)
- [ ] Configure Clerk authentication (frontend + backend)
- [ ] Implement JWT verification middleware
- [ ] Create workspace creation flow (on user signup)
- [ ] Set up TanStack Query in Next.js frontend
- [ ] Create API client structure (`lib/api/client.ts`)

**Acceptance Criteria:**

- User can sign up and log in via Clerk
- Backend validates JWT tokens correctly
- User workspace is created automatically on signup
- Frontend can make authenticated API calls

---

#### Week 2: Client Management & Invoice Creation

**Sprint Goal:** Implement client CRUD and invoice creation form.

**Tasks:**

- [ ] Implement client API endpoints (GET, POST, PATCH, DELETE)
- [ ] Create client list and form components
- [ ] Implement invoice creation API (POST /api/v1/invoices)
- [ ] Build invoice form with react-hook-form + zod
- [ ] Implement line items dynamic form (add/remove items)
- [ ] Add tax and discount calculations
- [ ] Implement invoice numbering logic

**Acceptance Criteria:**

- User can create, edit, and delete clients
- User can create invoice with multiple line items
- Tax and discount calculations are correct
- Invoice is saved as "draft" status

---

#### Week 3: Invoice Preview & PDF Export

**Sprint Goal:** Implement invoice preview and PDF generation.

**Tasks:**

- [ ] Create invoice preview page (GET /api/v1/invoices/:id)
- [ ] Build preview component (matches PDF layout)
- [ ] Implement PDF generation (server-side with pdfkit or client-side with jsPDF)
- [ ] Add print styles
- [ ] Test PDF generation on various invoice sizes

**Acceptance Criteria:**

- User can preview invoice before sending
- PDF exports correctly with all invoice data
- PDF is print-friendly
- Preview matches final PDF output

---

#### Week 4: Email Sending & Payment Links

**Sprint Goal:** Implement email sending and payment link generation.

**Tasks:**

- [ ] Set up SMTP service (SendGrid, Resend, or similar)
- [ ] Implement email sending API (POST /api/v1/invoices/:id/send)
- [ ] Create email templates (invoice, reminder)
- [ ] Integrate Stripe payment link generation
- [ ] Integrate PayPal payment link generation
- [ ] Add payment link to invoice email
- [ ] Implement email tracking (open pixel, link clicks)

**Acceptance Criteria:**

- User can send invoice via email
- Email includes payment link
- Payment link opens hosted checkout (Stripe or PayPal)
- Invoice status updates to "sent" after email send

---

#### Week 5: Payment Webhooks & Status Tracking

**Sprint Goal:** Handle payment events and update invoice status.

**Tasks:**

- [ ] Implement webhook endpoint (POST /api/v1/payments/webhook)
- [ ] Add webhook signature verification (Stripe/PayPal)
- [ ] Implement idempotency handling (prevent duplicate processing)
- [ ] Update invoice status on payment success
- [ ] Add payment record to database
- [ ] Implement overdue detection (scheduled job or cron)
- [ ] Add invoice status badge to UI

**Acceptance Criteria:**

- Payment webhook updates invoice status to "paid"
- Duplicate webhooks are handled idempotently
- Invoice status is visible in list and detail views
- Overdue invoices are marked automatically

---

#### Week 6: Estimates & Basic Reporting

**Sprint Goal:** Add estimates feature and basic reporting dashboard.

**Tasks:**

- [ ] Create estimate schema (similar to invoice)
- [ ] Implement estimate API endpoints
- [ ] Build estimate form and list components
- [ ] Implement estimate-to-invoice conversion
- [ ] Create basic reporting API (income by period, status counts)
- [ ] Build dashboard with charts (revenue, invoice counts)
- [ ] Add filters to reports (date range, status)

**Acceptance Criteria:**

- User can create and manage estimates
- User can convert estimate to invoice (one-click)
- Dashboard shows revenue and invoice metrics
- Reports can be filtered by date range

---

#### Week 7: Payment Reminders & Polish

**Sprint Goal:** Implement payment reminders and UI refinements.

**Tasks:**

- [ ] Create reminder scheduling API
- [ ] Implement automated reminder sending (cron job or queue)
- [ ] Add reminder management UI
- [ ] Refactor frontend components (extract reusable components)
- [ ] Optimize TanStack Query cache strategies
- [ ] Add loading states and error boundaries
- [ ] Implement responsive design improvements

**Acceptance Criteria:**

- User can schedule payment reminders
- Reminders are sent automatically
- UI is fully responsive (mobile, tablet, desktop)
- Loading states and errors are handled gracefully

---

#### Week 8: Testing, Bug Fixes & Deployment

**Sprint Goal:** Complete testing, fix bugs, and deploy to production.

**Tasks:**

- [ ] Write integration tests for API endpoints
- [ ] Write component tests for critical UI flows
- [ ] Perform end-to-end testing (manual + automated)
- [ ] Fix bugs and performance issues
- [ ] Set up production database (PostgreSQL on Render/GCP)
- [ ] Deploy Express backend (Render/Heroku/GCP)
- [ ] Deploy Next.js frontend (Vercel)
- [ ] Configure environment variables and secrets
- [ ] Set up database migrations (Prisma migrate)
- [ ] Test production deployment

**Acceptance Criteria:**

- All critical user flows work end-to-end
- API endpoints are tested (unit + integration)
- Application is deployed to production
- Database migrations run successfully
- Environment variables are configured securely

---

## Edge Cases & Non-Functional Requirements

### Concurrency & Race Conditions

**Double-Payment Prevention:**

- Use database transactions with row-level locking
- Check payment status before processing webhook
- Implement idempotency keys for webhook events

**Example:**

```typescript
// Process payment webhook with transaction
await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    lock: { mode: "update" },
  });

  if (invoice.status === "paid") {
    throw new Error("Invoice already paid"); // Idempotent
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid" },
  });
});
```

---

### Idempotency for Webhooks

**Pattern:**

- Store webhook event IDs in database
- Check if event already processed before handling
- Use database unique constraint on event ID

**Example:**

```typescript
// prisma/schema.prisma
model WebhookEvent {
  id        String   @id
  eventId   String   @unique // Stripe/PayPal event ID
  processed Boolean  @default(false)
  createdAt DateTime @default(now)
}

// Service
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId: webhookEvent.id }
});
if (existing?.processed) {
  return { success: true, message: 'Already processed' };
}
```

---

### Soft Deletes

**Implementation:**

- Add `deletedAt` timestamp to all models (nullable)
- Filter deleted records in queries
- Restore functionality (set `deletedAt` to null)

**Example:**

```typescript
// Prisma schema
model Invoice {
  id        String    @id
  deletedAt DateTime? @map("deleted_at")
  // ...
}

// Query helper
const invoices = await prisma.invoice.findMany({
  where: {
    workspaceId,
    deletedAt: null // Only non-deleted
  }
});
```

---

### Soft Constraints for Taxes & Currencies

**Tax Rates:**

- Store tax rates per line item (percentage)
- Allow 0% tax (no tax line)
- Support multiple tax rates per invoice
- Validate tax range (0-100% for percentage)

**Currencies:**

- Store currency code (ISO 4217: USD, EUR, etc.)
- Display currency symbol based on code
- MVP: Single currency per invoice (no conversion)
- Future: Multi-currency with exchange rates

---

### Backup Strategies

**Database Backups:**

- Daily automated backups (PostgreSQL on Render/GCP includes backups)
- Retention: 30 days of daily backups
- Test restore procedure monthly

**File Storage:**

- Use cloud storage (S3, Cloudinary) for uploads
- Enable versioning for important files
- Regular backup of file metadata (database)

---

### GDPR Considerations

**Data Handling:**

- User can export their data (GDPR Article 15)
- User can delete their account and all data (GDPR Article 17)
- Log data access and modifications
- Implement data retention policies (delete old drafts after 1 year)

**Implementation:**

- Export endpoint: `GET /api/v1/users/export` (returns JSON/CSV)
- Delete endpoint: `DELETE /api/v1/users/me` (soft delete, then hard delete after 30 days)

---

### Performance Targets

**API Response Times:**

- Invoice list (1000 invoices): < 250ms (with pagination)
- Single invoice fetch: < 100ms
- Invoice creation: < 500ms
- PDF generation: < 2s

**Frontend Performance:**

- Time to Interactive (TTI): < 3s
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s

**Optimization Strategies:**

- Database indexes on frequently queried fields (workspaceId, status, createdAt)
- API response caching (TanStack Query staleTime)
- Code splitting (Next.js dynamic imports)
- Image optimization (Next.js Image component)

---

## Pitfalls to Avoid

### Frontend Architecture

- ❌ **Don't:** Put all logic in page components (leads to 1000+ line files)
- ✅ **Do:** Extract reusable components and custom hooks

- ❌ **Don't:** Use prop drilling for deeply nested data
- ✅ **Do:** Use TanStack Query hooks to fetch data where needed

- ❌ **Don't:** Store API responses in component state
- ✅ **Do:** Use TanStack Query cache (single source of truth)

- ❌ **Don't:** Skip loading and error states
- ✅ **Do:** Handle all async states (loading, error, success, empty)

### Backend Architecture

- ❌ **Don't:** Skip input validation (trust client data)
- ✅ **Do:** Always validate with zod on server

- ❌ **Don't:** Return raw database errors to client
- ✅ **Do:** Map errors to user-friendly messages

- ❌ **Don't:** Skip authorization checks (assume user owns resource)
- ✅ **Do:** Verify workspace ownership on every request

- ❌ **Don't:** Process webhooks without idempotency
- ✅ **Do:** Check if event already processed before handling

### Database

- ❌ **Don't:** Use raw SQL with string concatenation
- ✅ **Do:** Use Prisma parameterized queries

- ❌ **Don't:** Skip database indexes on foreign keys and frequently queried fields
- ✅ **Do:** Add indexes on workspaceId, status, createdAt, clientId

- ❌ **Don't:** Hard delete records (lose audit trail)
- ✅ **Do:** Use soft deletes (deletedAt timestamp)

### Performance

- ❌ **Don't:** Fetch all invoices without pagination
- ✅ **Do:** Implement server-side pagination (limit/offset)

- ❌ **Don't:** Refetch data on every render
- ✅ **Do:** Use TanStack Query staleTime to prevent unnecessary refetches

- ❌ **Don't:** Generate PDFs synchronously (blocks request)
- ✅ **Do:** Use async PDF generation or queue for large invoices

---

## TODOs for Implementation

### Phase 1: Setup

- [ ] Set up Express backend project structure
- [ ] Configure Prisma with PostgreSQL
- [ ] Set up Clerk authentication
- [ ] Create database schema (User, Workspace, Client, Invoice, InvoiceItem, Payment, Estimate)
- [ ] Set up environment variables (.env.example)

### Phase 2: Core Features

- [ ] Implement client CRUD API
- [ ] Implement invoice CRUD API
- [ ] Build invoice form component
- [ ] Implement PDF generation
- [ ] Set up email service (SMTP)

### Phase 3: Payments

- [ ] Integrate Stripe payment links
- [ ] Integrate PayPal payment links
- [ ] Implement webhook handlers
- [ ] Add payment status tracking

### Phase 4: Polish

- [ ] Implement payment reminders
- [ ] Add basic reporting
- [ ] Optimize performance
- [ ] Write tests

### Phase 5: Deployment

- [ ] Set up production database
- [ ] Configure CI/CD
- [ ] Deploy backend and frontend
- [ ] Set up monitoring and error tracking

---

## Additional Notes

### Technology Decisions

- **Next.js App Router**: Use for routing, but client-side rendering (no SSR required for MVP)
- **TanStack Query**: Primary data fetching library (replaces useState + useEffect patterns)
- **react-hook-form**: All forms use this library (better performance than controlled inputs)
- **zod**: Single source of truth for validation (shared between client and server)
- **Prisma**: Type-safe database ORM (reduces SQL errors, provides migrations)

### Future Considerations (Post-MVP)

- Multi-workspace support (user can belong to multiple organizations)
- Team collaboration (invite users to workspace)
- Advanced reporting (P&L, balance sheets)
- Integrations (QuickBooks, Xero, Zapier)
- Mobile apps (React Native or native)

---

**Document Version:** 1.0  
**Last Updated:** 2025-05-11  
**Author:** Engineering Team  
**Status:** Ready for Implementation
