import type { JobContext } from '@livekit/agents';

export type QuantityUnit = 'DAYS' | 'HOURS' | 'UNITS';
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'NONE';

export interface LineItemDraft {
  name: string;
  description: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  unitPrice: number;
  discount: number;
  discountType: DiscountType;
  tax: number;
  vatEnabled: boolean;
  total: number;
}

export interface InvoiceDraft {
  customerId?: number;
  businessId?: number;
  items: LineItemDraft[];
  subtotal: number;
  totalTax: number;
  discount: number;
  total: number;
  dueDate?: Date;
  issueDate?: Date;
  notes?: string;
  currency?: string;
  terms?: string;
}

export interface EstimateDraft {
  clientId?: number;
  businessId?: number;
  items: LineItemDraft[];
  subtotal: number;
  totalTax: number;
  discount: number;
  total: number;
  estimateDate?: Date;
  expiryDate?: Date;
  notes?: string;
  currency?: string;
  terms?: string;
  summary?: string;
  estimateNumber?: string;
  requireSignature?: boolean;
}

export interface CatalogDraft {
  name: string;
  description: string;
  unitPrice: number;
  quantityUnit: QuantityUnit;
  // Voice prompt may provide sku/reference; we map it into description in the tool.
}

export interface ClientDraft {
  name: string;
  phone?: string;
  address?: string;
  email: string;
  notes?: string;
  // Optional backend fields (not required by the voice flow yet).
  nit?: string | null;
  businessName?: string | null;
}

export interface PaymentDraft {
  invoiceId?: number;
  amount: number;
  paymentDate?: Date;
  paymentMethod: string;
  notes?: string;
  transactionId?: string | null;
}

export interface ExpenseDraft {
  description?: string | null;
  amount: number;
  expenseDate?: Date;
  categoryWorkCategoryId?: number | null;
  notes?: string;
  tax?: number | null;
  // Optional backend receipt image is not supported in the voice flow yet.
}

export interface InvoiceSessionData {
  language: 'es' | 'en' | 'fr' | 'pt' | 'de';

  // Clerk workspace ID (from participant metadata)
  workspaceId: number;

  // Selected business for the currently active create flow.
  selectedBusinessId?: number;

  // Current invoice being built (DRAFT).
  currentInvoice: InvoiceDraft | null;
  // Current estimate being built (DRAFT).
  currentEstimate: EstimateDraft | null;

  // Product/catalog creation draft.
  currentCatalog: CatalogDraft | null;
  // Client creation draft.
  currentClientDraft: ClientDraft | null;

  // Payment draft.
  currentPayment: PaymentDraft | null;
  // Expense draft.
  currentExpense: ExpenseDraft | null;

  // When inline client creation is triggered mid invoice/estimate flow,
  // we snapshot the draft(s) so we can resume without the user repeating answers.
  inlineClientCreation?: {
    resumeEntity: 'invoice' | 'estimate';
    invoiceDraftSnapshot: InvoiceDraft | null;
    estimateDraftSnapshot: EstimateDraft | null;
  };

  // Last successfully created invoice (for idempotency)
  lastCreatedInvoice?: {
    id: number;
    invoiceNumber: string;
    total: number;
    createdAt: number; // timestamp
    idempotencyKey: string; // hash of invoice content
  };

  // Last successfully created estimate (for idempotency)
  lastCreatedEstimate?: {
    id: number;
    estimateNumber: string;
    total: number;
    createdAt: number; // timestamp
    idempotencyKey: string; // hash of estimate content
  };

  // Reference to job context for RPC
  ctx: JobContext;
}
