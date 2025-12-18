# Implementation Plan: Invoice SaaS Platform

## Plan Style Rationale

This plan uses a **Sprint-based Hybrid with Implementation Details** approach because:

1. **LLM-Friendly Structure**: Provides clear context (sprint goal) + actionable steps (specific tasks) + technical guidance (implementation notes)
2. **Progress Tracking**: Week-by-week sprints make it easy to track completion and identify blockers
3. **Iterative Development**: Each sprint builds on previous work, perfect for incremental LLM-assisted coding
4. **Flexible Yet Guided**: Technical notes provide guidance without being overly prescriptive, allowing for adaptive implementation
5. **Reference-Friendly**: Engineers can quickly find relevant sprint and jump to specific tasks

---

## Important Notes

- **File Structure**: The project file structure will be provided separately. Do not use the file structure examples from the PRD. Follow the structure provided by the project maintainer.
- **UI Preservation**: Keep all existing visual designs and UI components. Only refactor the code architecture, not the visual appearance.
- **Vertical Slice Architecture**: All features should follow vertical slice pattern (UI → API → DB) for complete end-to-end implementation.

---

## Week 1: Foundation, Setup & Frontend Refactoring

**Sprint Goal:** Establish backend infrastructure, database schema, authentication, and refactor frontend code structure while preserving UI design.

### Backend Setup

- [x] **Initialize Express.js backend with TypeScript**

  - Create new `backend/` directory in project root ✅
  - Initialize npm/yarn project with TypeScript config ✅
  - Set up Express app with basic middleware (cors, body-parser, helmet) ✅
  - Configure environment variables (.env.example with all required vars) ⚠️ (user mentioned .env already set up)
  - Set up project structure (use provided file structure when available) ✅
  - Add development scripts (dev, build, start, test) ✅

- [ ] **Set up PostgreSQL database**

  - Create database (local dev + production) ⚠️ (needs to be done manually)
  - Configure connection string in environment variables ✅ (assumed in .env)
  - Set up database connection pooling ✅ (Prisma handles this)
  - Document connection requirements ⚠️ (TODO)

- [x] **Configure Prisma ORM**

  - Install Prisma CLI and client ✅
  - Initialize Prisma schema file ✅
  - Configure database connection in Prisma schema ✅
  - Set up Prisma client generation script ✅
  - Create base Prisma schema with models: User, Workspace, Client, Invoice, InvoiceItem, Payment, Estimate ✅
  - Include relationships and indexes (workspaceId, status, createdAt, clientId) ✅
  - Add soft delete support (deletedAt fields) ✅
  - Run initial migration ⚠️ (needs to be run: `yarn prisma migrate dev`)

- [x] **Set up Clerk authentication (backend)**

  - Install Clerk SDK for Node.js ✅
  - Create authentication middleware to verify Clerk JWT tokens ✅
  - Implement workspace authorization check (verify user belongs to workspace) ✅
  - Add middleware to protect all API routes ✅
  - Create user/workspace sync endpoint (called when user signs up via Clerk webhook) ⚠️ (TODO - will be needed for Week 2)
  - Test JWT verification with sample tokens ⚠️ (needs manual testing)

- [x] **Create API route structure**
  - Set up Express router with `/api/v1` prefix ✅
  - Create route handlers structure (use provided file structure) ✅
  - Add error handling middleware ✅
  - Add request logging middleware ✅
  - Set up rate limiting middleware ✅
  - Configure CORS for Next.js frontend origin only ✅

### Frontend Setup & Refactoring

- [x] **Set up TanStack Query (React Query)**

  - Install @tanstack/react-query ✅
  - Create QueryClient provider in root layout ✅
  - Configure default query options (staleTime, cacheTime) ✅
  - Set up React Query DevTools (dev only) ✅
  - Create base API client with axios/fetch (configure base URL, auth headers) ✅

- [ ] **Refactor frontend code structure**

  - **Audit existing code**: Review all page components, identify large files (>500 lines), identify prop drilling, identify localStorage usage
  - **Extract reusable components**: Break down large page components into smaller, focused components
    - Extract form components (use react-hook-form patterns)
    - Extract list components (invoice list, client list)
    - Extract card/display components
    - Extract modal/dialog components
  - **Create custom hooks**: Extract data fetching logic into TanStack Query hooks
    - Replace useState + useEffect patterns with useQuery/useMutation
    - Create hooks for invoices, clients, estimates
    - Remove localStorage usage, replace with API calls (mark as TODO for backend implementation)
  - **Organize by feature**: Restructure components into feature-based folders (invoices/, clients/, estimates/)
  - **Set up validation layer**: Create shared zod schemas (will be used by both frontend forms and backend API)
  - **Improve routing**: Ensure clean Next.js App Router structure (use provided file structure)
  - **Add loading/error states**: Implement consistent loading and error handling patterns

- [x] **Integrate Clerk authentication (frontend)**

  - Install @clerk/nextjs ✅
  - Set up Clerk provider in root layout ✅
  - Protect dashboard routes with Clerk middleware ✅
  - Create auth hook to get session token for API calls ✅
  - Update API client to include Clerk JWT in Authorization header ✅

- [ ] **Set up shared validation schemas**
  - Create `lib/validations/` directory
  - Define zod schemas for Invoice, Client, Estimate (create, update variants)
  - Ensure schemas can be imported by both frontend and backend
  - Set up react-hook-form with zodResolver in all forms

### Database Schema Implementation

- [x] **Complete Prisma schema**
  - User model (sync with Clerk user ID) ✅
  - Workspace model (one per user in MVP) ✅
  - Client model (name, email, phone, address, taxId, workspace relation) ✅
  - Invoice model (invoiceNumber, status enum, dates, totals, workspace/client relations) ✅
  - InvoiceItem model (description, quantity, unitPrice, tax, invoice relation) ✅
  - Payment model (amount, provider, transactionId, invoice relation, timestamp) ✅
  - Estimate model (similar to Invoice, with expirationDate) ✅
  - Add indexes: workspaceId, clientId, status, createdAt, invoiceNumber ✅
  - Add soft delete fields (deletedAt) to all models ✅
  - Run migration and verify schema ⚠️ (needs to be run: `yarn prisma migrate dev`)

### Acceptance Criteria

- Express backend runs on configured port with TypeScript
- PostgreSQL database connected via Prisma
- All API routes protected with Clerk JWT verification
- Frontend can make authenticated API calls to backend
- Frontend code restructured: components extracted, hooks created, no prop drilling
- TanStack Query integrated and replacing useState/useEffect patterns
- Database schema created with all MVP models
- User workspace created automatically on Clerk signup (webhook or manual trigger)

---

## Week 2: Client Management & Invoice Creation

**Sprint Goal:** Implement complete client CRUD and invoice creation functionality end-to-end.

### Backend Implementation

- [ ] **Client API endpoints**

  - `GET /api/v1/clients` - List clients (with pagination, search, filtering)
  - `POST /api/v1/clients` - Create client (validate with zod schema)
  - `GET /api/v1/clients/:id` - Get single client
  - `PATCH /api/v1/clients/:id` - Update client (validate workspace ownership)
  - `DELETE /api/v1/clients/:id` - Soft delete client
  - Add workspace authorization checks to all endpoints
  - Implement error handling (404, 403, 400)

- [ ] **Invoice creation API**

  - `POST /api/v1/invoices` - Create invoice (validate with zod, calculate totals)
  - Implement invoice numbering logic (workspace prefix + auto-increment)
  - Calculate subtotal, tax, discount, total
  - Store invoice as "draft" status
  - Return created invoice with all calculated fields

- [ ] **Invoice retrieval API**
  - `GET /api/v1/invoices` - List invoices (pagination, status filter, date range)
  - `GET /api/v1/invoices/:id` - Get single invoice (with items, client details)
  - Add workspace authorization checks

### Frontend Implementation

- [ ] **Client management components**

  - Create client list page (use TanStack Query to fetch clients)
  - Create client form component (react-hook-form + zod)
  - Create client card/list item component
  - Implement create, edit, delete client flows
  - Add search and filtering UI
  - Replace localStorage with API calls

- [ ] **Invoice creation form**

  - Create invoice form page (`/invoices/new`)
  - Implement dynamic line items (add/remove items)
  - Client selection dropdown (fetch from API)
  - Date pickers for issue date and due date
  - Tax and discount inputs (percentage or fixed)
  - Real-time calculation of totals (subtotal, tax, discount, total)
  - Form validation with zod (shared schema with backend)
  - Submit form to create invoice API
  - Use TanStack Query mutation with optimistic updates
  - Handle loading and error states

- [ ] **Replace localStorage with API**
  - Remove all localStorage usage for invoices
  - Update all invoice-related components to use TanStack Query hooks
  - Ensure data flows from API → TanStack Query cache → UI

### Acceptance Criteria

- User can create, view, edit, and delete clients via UI
- Client data persists in database (not localStorage)
- User can create invoice with multiple line items
- Invoice totals calculate correctly (subtotal, tax, discount, total)
- Invoice is saved to database with "draft" status
- Invoice numbering works (unique per workspace)
- All forms use react-hook-form with zod validation
- All data fetching uses TanStack Query (no useState + useEffect)

---

## Week 3: Invoice Preview & PDF Export

**Sprint Goal:** Implement invoice preview and PDF generation functionality.

### Backend Implementation

- [ ] **Invoice preview data endpoint**

  - Ensure `GET /api/v1/invoices/:id` returns all data needed for preview
  - Include client details, company details, items, totals
  - Verify workspace authorization

- [ ] **PDF generation service**
  - Choose PDF library (pdfkit for server-side recommended, or jsPDF for client-side)
  - Create PDF generation service/utility
  - Design PDF layout (match invoice preview design)
  - Include company logo, invoice details, client info, line items, totals
  - Generate PDF from invoice data
  - Add endpoint `GET /api/v1/invoices/:id/pdf` (optional, if server-side PDF)
  - Test PDF generation with various invoice sizes

### Frontend Implementation

- [ ] **Invoice preview page**

  - Create invoice preview route (`/invoices/[id]/preview`)
  - Fetch invoice data using TanStack Query
  - Build preview component matching PDF layout
  - Display all invoice details (company info, client, items, totals, notes)
  - Add print styles (CSS @media print)
  - Test print functionality

- [ ] **PDF export functionality**

  - If using client-side (jsPDF): Generate PDF from preview component
  - If using server-side: Fetch PDF from API endpoint
  - Add download button to preview page
  - Test PDF generation with various invoice sizes
  - Ensure PDF includes all invoice data correctly

- [ ] **Invoice detail/view page**
  - Create invoice detail route (`/invoices/[id]`)
  - Display invoice in read-only mode
  - Add action buttons (edit if draft, send, download PDF)
  - Show invoice status badge

### Acceptance Criteria

- User can preview invoice before sending
- Preview matches final PDF output visually
- PDF exports correctly with all invoice data
- PDF is print-friendly (proper page breaks, margins)
- Invoice detail page displays all invoice information
- PDF generation works for invoices with 1-50+ line items

---

## Week 4: Email Sending & Payment Links

**Sprint Goal:** Implement email sending and payment link generation for invoices.

### Backend Implementation

- [ ] **Email service setup**

  - Choose email provider (SendGrid, Resend, or similar)
  - Configure SMTP credentials in environment variables
  - Create email service utility
  - Create email templates (invoice, reminder, payment confirmation)
  - Test email sending

- [ ] **Send invoice endpoint**

  - `POST /api/v1/invoices/:id/send` - Send invoice via email
  - Validate invoice exists and belongs to workspace
  - Generate email content from template
  - Include invoice PDF as attachment (optional)
  - Send email via email service
  - Update invoice status to "sent"
  - Log email send event
  - Return send confirmation

- [ ] **Stripe payment link integration**

  - Install Stripe SDK
  - Configure Stripe API keys (environment variables)
  - Create service to generate Stripe payment links
  - Generate payment link when invoice is sent
  - Store payment link URL in invoice record
  - Handle Stripe webhook events (prepare webhook endpoint structure)

- [ ] **PayPal payment link integration**
  - Install PayPal SDK
  - Configure PayPal API credentials (environment variables)
  - Create service to generate PayPal payment links
  - Support both Stripe and PayPal (user chooses provider)
  - Store payment link URL in invoice record

### Frontend Implementation

- [ ] **Send invoice UI**

  - Create send invoice dialog/modal component
  - Email input field (pre-fill with client email)
  - Custom email subject and message fields
  - Payment provider selection (Stripe or PayPal)
  - Send button with loading state
  - Use TanStack Query mutation to call send API
  - Show success/error toast notifications
  - Update invoice status in cache after successful send

- [ ] **Email tracking (basic)**
  - Add email open tracking pixel (optional, for MVP)
  - Track payment link clicks (add query params to payment links)

### Acceptance Criteria

- User can send invoice via email with custom message
- Email includes payment link (Stripe or PayPal)
- Payment link opens hosted checkout page
- Invoice status updates to "sent" after email send
- Email sending errors are handled gracefully
- Payment links are stored in database

---

## Week 5: Payment Webhooks & Status Tracking

**Sprint Goal:** Handle payment events via webhooks and track invoice status updates.

### Backend Implementation

- [ ] **Webhook endpoint**

  - `POST /api/v1/payments/webhook` - Handle Stripe and PayPal webhooks
  - Verify webhook signatures (Stripe signature, PayPal signature)
  - Parse webhook payload (different for Stripe vs PayPal)
  - Identify invoice from webhook data
  - Handle idempotency (check if webhook event already processed)
  - Store webhook event ID to prevent duplicate processing

- [ ] **Payment processing**

  - On successful payment webhook:
    - Update invoice status to "paid"
    - Create Payment record in database
    - Store payment details (amount, provider, transaction ID, timestamp)
    - Send payment confirmation email to client (optional)
  - Handle failed payment webhooks
  - Handle refund webhooks (update invoice status accordingly)

- [ ] **Overdue detection**

  - Create scheduled job/cron task (or manual trigger endpoint for MVP)
  - Query invoices with status "sent" and dueDate < today
  - Update status to "overdue"
  - Optionally send overdue reminder email
  - Run daily (or on-demand for MVP)

- [ ] **Invoice status tracking**
  - Add "viewed" status tracking (when client opens invoice link)
  - Store viewed timestamp
  - Update invoice lastViewedAt field

### Frontend Implementation

- [ ] **Invoice status display**

  - Add status badge to invoice list items
  - Color-code statuses (draft, sent, paid, overdue)
  - Show status in invoice detail page
  - Update status in real-time (TanStack Query refetch interval or webhook push)

- [ ] **Payment status updates**

  - Poll invoice status (or use websockets/SSE for real-time updates)
  - Update UI when payment is received
  - Show payment details (amount, date, provider) in invoice detail

- [ ] **Dashboard updates**
  - Update dashboard stats when invoice status changes
  - Show paid vs pending amounts
  - Display overdue invoices count

### Acceptance Criteria

- Payment webhook updates invoice status to "paid" correctly
- Duplicate webhooks are handled idempotently (no duplicate payments recorded)
- Invoice status is visible in list and detail views
- Overdue invoices are marked automatically
- Payment details are stored and displayed
- Invoice status updates reflect in UI (via polling or real-time)

---

## Week 6: Estimates & Basic Reporting

**Sprint Goal:** Add estimates feature and basic reporting dashboard.

### Backend Implementation

- [ ] **Estimate schema and API**

  - Add Estimate model to Prisma schema (similar to Invoice)
  - Add expirationDate field
  - Create estimate API endpoints:
    - `GET /api/v1/estimates` - List estimates
    - `POST /api/v1/estimates` - Create estimate
    - `GET /api/v1/estimates/:id` - Get single estimate
    - `PATCH /api/v1/estimates/:id` - Update estimate
    - `DELETE /api/v1/estimates/:id` - Delete estimate
  - Add workspace authorization checks

- [ ] **Estimate-to-invoice conversion**

  - `POST /api/v1/estimates/:id/convert` - Convert estimate to invoice
  - Copy estimate data to new invoice
  - Map estimate items to invoice items
  - Set invoice status to "draft"
  - Return created invoice

- [ ] **Reporting API**
  - `GET /api/v1/reports/income` - Income by period (monthly, quarterly, yearly)
  - `GET /api/v1/reports/invoices` - Invoice counts by status
  - `GET /api/v1/reports/revenue` - Revenue summary (total, paid, pending, overdue)
  - Add date range filtering
  - Add workspace authorization checks
  - Aggregate data from invoices table

### Frontend Implementation

- [ ] **Estimates feature**

  - Create estimates list page
  - Create estimate form component (similar to invoice form)
  - Create estimate detail/preview page
  - Add "Convert to Invoice" button in estimate detail
  - Use TanStack Query for all estimate operations
  - Replace localStorage with API calls

- [ ] **Dashboard reporting**

  - Update dashboard with real data from API
  - Revenue chart (monthly income over time)
  - Invoice status counts (paid, pending, overdue)
  - Recent invoices list
  - Use TanStack Query to fetch report data
  - Add date range filters to reports

- [ ] **Reports page**
  - Create reports/dashboard page
  - Display income by period
  - Show invoice statistics
  - Add filters (date range, status)
  - Use charts/graphs for visualizations

### Acceptance Criteria

- User can create and manage estimates
- User can convert estimate to invoice (one-click)
- Dashboard shows revenue and invoice metrics from API
- Reports can be filtered by date range
- All estimate data persists in database (not localStorage)
- Charts/graphs display real data from API

---

## Week 7: Payment Reminders & UI Polish

**Sprint Goal:** Implement payment reminders and refine UI with loading states, error handling, and responsive improvements.

### Backend Implementation

- [ ] **Reminder scheduling API**

  - Add Reminder model to Prisma schema (invoiceId, scheduledDate, sent, workspaceId)
  - `POST /api/v1/invoices/:id/reminders` - Schedule reminder
  - `GET /api/v1/reminders` - List reminders
  - `DELETE /api/v1/reminders/:id` - Cancel reminder
  - Add workspace authorization checks

- [ ] **Automated reminder sending**
  - Create scheduled job/cron task (or manual trigger for MVP)
  - Query reminders where scheduledDate <= now and sent = false
  - Send reminder email (use email template)
  - Update reminder sent status
  - Log reminder send events
  - Run daily (or on-demand for MVP)

### Frontend Implementation

- [ ] **Payment reminders UI**

  - Create reminders management page
  - Add "Schedule Reminder" button to invoice detail
  - Display scheduled reminders list
  - Allow canceling reminders
  - Show reminder history (sent reminders)

- [ ] **Component refactoring and optimization**

  - Extract more reusable components (if not done in Week 1)
  - Add React.memo to expensive list items
  - Optimize TanStack Query cache strategies (staleTime, cacheTime)
  - Implement optimistic updates for all mutations
  - Add background refetch intervals for status updates

- [ ] **Loading states and error handling**

  - Add loading skeletons to all list pages
  - Add loading spinners to forms and buttons
  - Implement error boundaries for graceful error handling
  - Add retry mechanisms for failed API calls
  - Show user-friendly error messages (not raw API errors)

- [ ] **Responsive design improvements**
  - Test and fix mobile responsiveness
  - Ensure tables are responsive (horizontal scroll or card layout)
  - Test touch interactions on mobile
  - Verify forms work well on small screens
  - Test on tablet sizes

### Acceptance Criteria

- User can schedule payment reminders for invoices
- Reminders are sent automatically (or manually triggered)
- UI is fully responsive (mobile, tablet, desktop)
- Loading states are shown during API calls
- Errors are handled gracefully with user-friendly messages
- TanStack Query cache is optimized (no unnecessary refetches)
- Components are properly memoized where needed

---

## Week 8: Testing, Bug Fixes & Deployment

**Sprint Goal:** Complete testing, fix bugs, and deploy to production.

### Testing

- [ ] **API integration tests**

  - Write tests for all API endpoints
  - Test authentication and authorization
  - Test validation errors
  - Test error handling
  - Use test database (separate from dev/prod)

- [ ] **Component tests**

  - Write tests for critical UI components (forms, lists)
  - Test form validation
  - Test TanStack Query hooks
  - Use React Testing Library

- [ ] **End-to-end testing**
  - Test critical user flows:
    - Create invoice → Preview → Send → Payment → Status update
    - Create client → Create invoice → Send
    - Create estimate → Convert to invoice
  - Manual testing of all features
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile devices

### Bug Fixes & Performance

- [ ] **Bug fixes**

  - Fix all identified bugs from testing
  - Fix TypeScript errors
  - Fix linting errors
  - Verify all features work end-to-end

- [ ] **Performance optimization**
  - Optimize database queries (add missing indexes)
  - Optimize API response times
  - Optimize frontend bundle size (code splitting)
  - Test with large datasets (1000+ invoices)
  - Verify performance targets from PRD are met

### Deployment

- [ ] **Production database setup**

  - Set up PostgreSQL on production (Render/GCP/Heroku)
  - Configure connection strings
  - Run Prisma migrations on production
  - Verify database connection

- [ ] **Backend deployment**

  - Deploy Express backend (Render/Heroku/GCP)
  - Configure environment variables
  - Set up CORS for production frontend URL
  - Configure webhook endpoints (Stripe/PayPal webhook URLs)
  - Test backend API in production

- [ ] **Frontend deployment**

  - Deploy Next.js frontend to Vercel
  - Configure environment variables (API URL, Clerk keys)
  - Configure domain and SSL
  - Test frontend in production

- [ ] **Final verification**
  - Test complete user flow in production
  - Verify all integrations work (Clerk, Stripe, PayPal, Email)
  - Test payment webhooks in production
  - Verify database migrations ran successfully
  - Check error logging and monitoring

### Acceptance Criteria

- All critical user flows work end-to-end in production
- API endpoints are tested (unit + integration tests written)
- Application is deployed to production (backend + frontend)
- Database migrations run successfully in production
- Environment variables are configured securely
- All integrations work correctly (auth, payments, email)
- Performance targets are met (< 250ms API response, < 3s TTI)

---

## Implementation Notes

### Code Quality Standards

- **TypeScript**: All code must be fully typed (no `any` types)
- **Error Handling**: All API calls must have error handling
- **Validation**: All inputs validated with zod (client + server)
- **Authorization**: All API endpoints verify workspace ownership
- **Testing**: Critical paths must have tests (API + components)

### Common Patterns to Follow

- **TanStack Query**: Use for all data fetching (no useState + useEffect)
- **react-hook-form**: Use for all forms with zodResolver
- **Optimistic Updates**: Implement for all mutations (create, update, delete)
- **Loading States**: Always show loading indicators
- **Error States**: Always show user-friendly error messages
- **Soft Deletes**: Use deletedAt timestamp, never hard delete

### Pitfalls to Avoid

- ❌ Don't skip input validation on server
- ❌ Don't trust client data (always verify on server)
- ❌ Don't forget workspace authorization checks
- ❌ Don't use localStorage for data that should be in database
- ❌ Don't skip error handling
- ❌ Don't hardcode API URLs or secrets
- ❌ Don't forget to test webhook idempotency

---

## Progress Tracking

Use this checklist to track overall progress:

- [ ] Week 1: Foundation, Setup & Frontend Refactoring
- [ ] Week 2: Client Management & Invoice Creation
- [ ] Week 3: Invoice Preview & PDF Export
- [ ] Week 4: Email Sending & Payment Links
- [ ] Week 5: Payment Webhooks & Status Tracking
- [ ] Week 6: Estimates & Basic Reporting
- [ ] Week 7: Payment Reminders & UI Polish
- [ ] Week 8: Testing, Bug Fixes & Deployment

---

**Last Updated:** 2025-05-11  
**Status:** Ready for Implementation
