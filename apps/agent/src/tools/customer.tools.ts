import { PHONE_REGEX, nullableOptional } from '@addinvoice/schemas';
import { llm } from '@livekit/agents';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import type { InvoiceSessionData } from '../types/session-data';

/**
 * Formats an email address for clear TTS pronunciation
 * Example: "user@gmail.com" -> "user at gmail dot com"
 */
function formatEmailForSpeech(email: string | null | undefined): string {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email; // Fallback if no @ found
  const normalizedDomain = domain.replace(/\./g, ' dot ');
  return `${localPart} at ${normalizedDomain}`;
}

const EMAIL_AT_DOT_WORDS: Record<
  InvoiceSessionData['language'],
  { atWord: string; dotWord: string }
> = {
  en: { atWord: 'at', dotWord: 'dot' },
  es: { atWord: 'arroba', dotWord: 'punto' },
  fr: { atWord: 'arobase', dotWord: 'point' },
  pt: { atWord: 'arroba', dotWord: 'ponto' },
  de: { atWord: 'at', dotWord: 'punkt' },
};

/**
 * Convert a speech-style email like:
 *   "john at gmail dot com"
 * into a conventional email like:
 *   "john@gmail.com"
 */
function normalizeEmailInput(query: string, language: InvoiceSessionData['language']): string {
  const q = query.trim();
  if (!q) return q;

  // If it already looks like an email, keep as-is (but remove spaces around punctuation).
  if (q.includes('@') && q.includes('.')) {
    return q.replace(/\s+/g, '');
  }

  const normalized = q.toLowerCase().replace(/\s+/g, ' ');
  const { atWord, dotWord } = EMAIL_AT_DOT_WORDS[language];

  // Always support english "at"/"dot" as a fallback because STT output can vary.
  const atWords = Array.from(new Set([atWord, 'at']));
  const dotWords = Array.from(new Set([dotWord, 'dot']));

  let replaced = normalized;
  for (const aw of atWords) {
    replaced = replaced.replace(new RegExp(`\\b${aw}\\b`, 'gi'), '@');
  }
  for (const dw of dotWords) {
    replaced = replaced.replace(new RegExp(`\\b${dw}\\b`, 'gi'), '.');
  }

  // In some STT cases, users might say just "dot com" etc without "at".
  // If we now have any '@' symbol, remove spaces; otherwise return best-effort string.
  replaced = replaced.replace(/\s+/g, '');
  return replaced;
}

/**
 * Lookup existing customer by name or email
 */
export function createLookupCustomerTool() {
  return llm.tool({
    description:
      'Search for an existing customer by name or email in the database. If one customer is returned, call selectCustomer with that ID immediately. If multiple are returned, list them to the user and ask which one',
    parameters: z.object({
      query: z.string().describe('Customer name or email to search'),
    }),
    execute: async ({ query }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        const normalizedQuery = normalizeEmailInput(query, sessionData.language);
        console.log(
          `[tool][lookupCustomer] workspaceId=${sessionData.workspaceId} query="${query}" normalized="${normalizedQuery}"`,
        );

        const customers = await prisma.client.findMany({
          where: {
            workspaceId: sessionData.workspaceId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessName: true,
          },
        });

        if (customers.length === 0) {
          const result = {
            found: false,
            message:
              'No customers found. Please create the customer in the main application first, then try again.',
          };
          return result;
        }

        // Format customer list with emails for speech
        const customerList = customers
          .map(
            (c: { name: string; email: string | null }) =>
              `- ${c.name}${c.email ? ` (${formatEmailForSpeech(c.email)})` : ''}`,
          )
          .join('\n');

        const result = {
          found: true,
          customers: customers,
          message: `Found ${customers.length} customer(s):\n${customerList}\nPlease confirm which one.`,
        };
        console.log(`[tool][lookupCustomer] found ${customers.length} customer(s)`);
        return result;
      } catch {
        console.error('[tool][lookupCustomer] failed');
        throw new llm.ToolError('Unable to retrieve customers');
      }
    },
  });
}

/**
 * Select existing customer by ID
 */
export function createSelectCustomerTool() {
  return llm.tool({
    description:
      'Select an existing customer by ID to associate with the current draft invoice or estimate. Use this after lookupCustomer (immediately when only one customer matches, or after the user chooses when multiple match). After calling this tool, always tell the user aloud which customer was selected so they get confirmation.',
    parameters: z.object({
      customerId: z
        .number()
        .int()
        .describe('The ID of the customer to select (from lookupCustomer results)'),
    }),
    execute: async ({ customerId }, { ctx }) => {
      try {
        const sessionData = ctx.session.userData as InvoiceSessionData;

        console.log(
          `[tool][selectCustomer] workspaceId=${sessionData.workspaceId} customerId=${customerId} selectedBusinessId=${sessionData.selectedBusinessId ?? 'none'}`,
        );

        if (!sessionData.selectedBusinessId) {
          throw new llm.ToolError(
            'No business selected. Please select a business first using selectBusiness.',
          );
        }

        // Verify customer exists and belongs to workspace
        const customer = await prisma.client.findFirst({
          where: {
            id: customerId,
            workspaceId: sessionData.workspaceId,
          },
          select: { id: true, name: true, email: true },
        });

        if (!customer) {
          throw new llm.ToolError(
            'Customer not found or does not belong to this workspace. Please search again using lookupCustomer.',
          );
        }

        // Initialize invoice/estimate drafts if needed
        if (!sessionData.currentInvoice) {
          sessionData.currentInvoice = {
            businessId: sessionData.selectedBusinessId,
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }
        if (!sessionData.currentEstimate) {
          sessionData.currentEstimate = {
            businessId: sessionData.selectedBusinessId,
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }

        // Set the selected client for both possible drafts.
        // The active workflow will use the relevant ID.
        sessionData.currentInvoice.customerId = customer.id;
        sessionData.currentEstimate.clientId = customer.id;

        return {
          success: true,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          message: `Customer "${customer.name}" selected.${customer.email ? ` Email: ${formatEmailForSpeech(customer.email)}` : ''}`,
        };
      } catch (error) {
        console.error('[tool][selectCustomer] failed', error);
        if (error instanceof llm.ToolError) throw error;
        throw new llm.ToolError('Unable to select customer. Please try again.');
      }
    },
  });
}

/**
 * Flat client shape (base layer).
 * Used for response relations and as the foundation for request/response schemas.
 */
export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(255, 'Client name is too long'),
  email: z.string().trim().email('Invalid email address'),
  phone: nullableOptional(
    z
      .string()
      .trim()
      .regex(PHONE_REGEX, 'The phone must have a valid international format (e.g. +573011234567)'),
  ),
  address: nullableOptional(z.string().trim().max(100, 'Address cannot exceed 100 characters')),
  nit: nullableOptional(z.string().trim().max(15, 'NIT/Cedula cannot exceed 15 characters')),
  businessName: nullableOptional(
    z.string().trim().max(100, 'Business name cannot exceed 100 characters'),
  ),
  reminderBeforeDueIntervalDays: nullableOptional(z.coerce.number().int()),
  reminderAfterDueIntervalDays: nullableOptional(z.coerce.number().int()),
});

/**
 * Create new customer
 */
export function createCreateCustomerTool() {
  return llm.tool({
    description:
      'Create a new customer in the database. Phone numbers must be in international format with + prefix (e.g., +573011234567).',
    parameters: z.object({
      name: createClientSchema.shape.name.describe('Customer full name'),
      email: createClientSchema.shape.email.describe('Customer email address'),
      phone: createClientSchema.shape.phone.describe(
        'Customer phone number in international format (e.g., +573011234567). Must start with + followed by country code and number.',
      ),
      address: createClientSchema.shape.address.describe('Customer address'),
      nit: createClientSchema.shape.nit.describe('Tax ID or NIT'),
      businessName: createClientSchema.shape.businessName.describe('Business name if applicable'),
      reminderBeforeDueIntervalDays:
        createClientSchema.shape.reminderBeforeDueIntervalDays.describe(
          'Reminder interval before due date in days (e.g., 3 = every 3 days while invoice active). Leave empty to disable.',
        ),
      reminderAfterDueIntervalDays: createClientSchema.shape.reminderAfterDueIntervalDays.describe(
        'Reminder interval after due date in days (e.g., 1 = every 1 day when past due). Leave empty to disable.',
      ),
      resumeEntity: z
        .enum(['invoice', 'estimate'])
        .nullish()
        .describe(
          'If this client is being created inline, tells the tool which draft to associate it with after creation.',
        ),
    }),
    execute: async (
      {
        name,
        email,
        phone,
        address,
        nit,
        businessName,
        reminderBeforeDueIntervalDays,
        reminderAfterDueIntervalDays,
        resumeEntity,
      },
      { ctx },
    ) => {
      const sessionData = ctx.session.userData as InvoiceSessionData;

      const normalizedEmail = normalizeEmailInput(email, sessionData.language);

      if (resumeEntity && !sessionData.selectedBusinessId) {
        throw new llm.ToolError('No business selected. Please select a business first.');
      }

      console.log(
        `[tool][createClient] workspaceId=${sessionData.workspaceId} resumeEntity=${resumeEntity ?? 'none'} name="${name}" email="${email}" normalizedEmail="${normalizedEmail}"`,
      );

      // Snapshot the current invoice/estimate draft so we can resume reliably after inline client creation.
      if (resumeEntity) {
        sessionData.inlineClientCreation = {
          resumeEntity,
          invoiceDraftSnapshot: sessionData.currentInvoice
            ? structuredClone(sessionData.currentInvoice)
            : null,
          estimateDraftSnapshot: sessionData.currentEstimate
            ? structuredClone(sessionData.currentEstimate)
            : null,
        };
      }

      // Validate + normalize against the shared schema.
      const parsed = createClientSchema.safeParse({
        name,
        email: normalizedEmail,
        phone,
        address,
        nit,
        businessName,
        reminderBeforeDueIntervalDays,
        reminderAfterDueIntervalDays,
      });

      if (!parsed.success) {
        throw new llm.ToolError(
          `Invalid client details. Please check the ${parsed.error.issues[0]?.path?.join('.') ?? 'fields'}.`,
        );
      }

      const validated = parsed.data;

      // Get next sequence number
      const lastClient = await prisma.client.findFirst({
        where: { workspaceId: sessionData.workspaceId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });

      const customer = await prisma.client.create({
        data: {
          workspaceId: sessionData.workspaceId,
          name: validated.name,
          email: validated.email,
          phone: validated.phone ?? null,
          address: address ?? null,
          nit: validated.nit ?? null,
          businessName: validated.businessName ?? null,
          reminderBeforeDueIntervalDays: validated.reminderBeforeDueIntervalDays ?? null,
          reminderAfterDueIntervalDays: validated.reminderAfterDueIntervalDays ?? null,
          sequence: (lastClient?.sequence || 0) + 1,
        },
      });

      // Inline resume: associate the newly created client with the appropriate draft(s).
      if (resumeEntity === 'invoice') {
        if (resumeEntity && sessionData.inlineClientCreation?.invoiceDraftSnapshot) {
          sessionData.currentInvoice = structuredClone(
            sessionData.inlineClientCreation.invoiceDraftSnapshot,
          );
        }
        if (!sessionData.currentInvoice) {
          sessionData.currentInvoice = {
            businessId: sessionData.selectedBusinessId!,
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }
        sessionData.currentInvoice!.customerId = customer.id;
      }

      if (resumeEntity === 'estimate') {
        if (resumeEntity && sessionData.inlineClientCreation?.estimateDraftSnapshot) {
          sessionData.currentEstimate = structuredClone(
            sessionData.inlineClientCreation.estimateDraftSnapshot,
          );
        }
        if (!sessionData.currentEstimate) {
          sessionData.currentEstimate = {
            businessId: sessionData.selectedBusinessId!,
            items: [],
            subtotal: 0,
            totalTax: 0,
            discount: 0,
            total: 0,
          };
        }
        sessionData.currentEstimate!.clientId = customer.id;
      }

      delete sessionData.inlineClientCreation;

      return {
        success: true,
        customerId: customer.id,
        message: `Client "${customer.name}" created successfully.`,
        clientEmail: customer.email,
      };
    },
  });
}
