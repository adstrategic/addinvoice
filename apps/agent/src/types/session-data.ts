import type { JobContext } from '@livekit/agents';

export interface InvoiceSessionData {
  // Clerk workspace ID (from participant metadata)
  workspaceId: number;
  
  // Current invoice being built
  currentInvoice: {
    customerId?: number;
    businessId?: number;
    items: Array<{
      name: string;
      description: string;
      quantity: number;
      quantityUnit: 'DAYS' | 'HOURS' | 'UNITS';
      unitPrice: number;
      discount: number;
      discountType: 'PERCENTAGE' | 'FIXED' | 'NONE';
      tax: number;
      vatEnabled: boolean;
      total: number;
    }>;
    subtotal: number;
    totalTax: number;
    discount: number;
    total: number;
    dueDate?: Date;
    notes?: string;
  } | null;
  
  // Last successfully created invoice (for idempotency)
  lastCreatedInvoice?: {
    id: number;
    invoiceNumber: string;
    total: number;
    createdAt: number; // timestamp
    idempotencyKey: string; // hash of invoice content
  };
  
  // Reference to job context for RPC
  ctx: JobContext;
}
