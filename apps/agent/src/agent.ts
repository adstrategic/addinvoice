import { llm, voice } from '@livekit/agents';
import { z } from 'zod';
import {
  getCatalogWorkflowInstructions,
  getClientWorkflowInstructions,
  getEstimateWorkflowInstructions,
  getExpenseWorkflowInstructions,
  getInsightsWorkflowInstructions,
  getInvoiceWorkflowInstructions,
  getPaymentWorkflowInstructions,
  getRootInstructions,
} from './prompts/addinvoices.js';
import { createListBusinessesTool, createSelectBusinessTool } from './tools/business.tools.js';
import { createCreateCatalogTool } from './tools/catalog.tools.js';
import {
  createCreateCustomerTool,
  createLookupCustomerTool,
  createSelectCustomerTool,
} from './tools/customer.tools.js';
import { createAddEstimateItemTool, createCreateEstimateTool } from './tools/estimate.tools.js';
import { createCreateExpenseTool } from './tools/expense.tools.js';
import { getSharedInsightTools } from './tools/insights.tools.js';
import { createAddInvoiceItemTool, createCreateInvoiceTool } from './tools/invoice.tools.js';
import {
  createCreatePaymentTool,
  createListAvailableInvoicesTool,
} from './tools/payment.tools.js';
import {
  createSearchWorkCategoriesTool,
  createSelectWorkCategoryTool,
} from './tools/work-categories.tools.js';
import type { InvoiceSessionData } from './types/session-data';

type SupportedLanguage = 'es' | 'en' | 'fr' | 'pt' | 'de';

const sharedInsightTools = getSharedInsightTools();

class InvoiceWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getInvoiceWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
        lookupCustomer: createLookupCustomerTool(),
        selectCustomer: createSelectCustomerTool(),
        addInvoiceItem: createAddInvoiceItemTool(),
        createInvoice: createCreateInvoiceTool(),
        createClient: createCreateCustomerTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][invoice] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class EstimateWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getEstimateWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
        lookupCustomer: createLookupCustomerTool(),
        selectCustomer: createSelectCustomerTool(),
        addEstimateItem: createAddEstimateItemTool(),
        createEstimate: createCreateEstimateTool(),
        createClient: createCreateCustomerTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][estimate] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class ClientWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getClientWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        createClient: createCreateCustomerTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][client] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class CatalogWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getCatalogWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
        createCatalog: createCreateCatalogTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][catalog] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class PaymentWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getPaymentWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
        listAvailableInvoices: createListAvailableInvoicesTool(),
        createPayment: createCreatePaymentTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][payment] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class ExpenseWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getExpenseWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
        searchWorkCategories: createSearchWorkCategoriesTool(),
        selectWorkCategory: createSelectWorkCategoryTool(),
        createExpense: createCreateExpenseTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][expense] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

class InsightsWorkflowAgent extends voice.Agent {
  constructor({ language, chatCtx }: { language: SupportedLanguage; chatCtx?: unknown }) {
    super({
      instructions: getInsightsWorkflowInstructions(language),
      tools: {
        ...sharedInsightTools,
        listBusinesses: createListBusinessesTool(),
        selectBusiness: createSelectBusinessTool(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(chatCtx ? { chatCtx: chatCtx as any } : {}),
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][workflow][insights] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

export class AddInvoicesRootAgent extends voice.Agent {
  constructor({ language }: { language: SupportedLanguage }) {
    const routeToWorkflow = llm.tool({
      description:
        'Route the user to the correct agent: create workflows (invoice, estimate, client, catalog, payment, expense) or insights for questions about counts, lists, revenue, outstanding balances, or expenses.',
      parameters: z.object({
        workflow: z.enum([
          'invoice',
          'estimate',
          'client',
          'catalog',
          'payment',
          'expense',
          'insights',
        ]),
      }),
      execute: async ({ workflow }, { ctx }) => {
        const sessionData = ctx.session.userData as InvoiceSessionData;
        console.log(
          `[agent][root] routeToWorkflow workflow="${workflow}" language="${sessionData.language}" workspaceId=${sessionData.workspaceId} selectedBusinessId=${sessionData.selectedBusinessId ?? 'none'}`,
        );
        const seededChatCtx = ctx.session.chatCtx.copy({
          excludeInstructions: true,
          excludeHandoff: true,
          excludeFunctionCall: true,
          excludeEmptyMessage: true,
        });

        const agentLanguage = sessionData.language ?? language;

        let agent: voice.Agent;
        switch (workflow) {
          case 'insights':
            console.log('[agent][root] handing off to InsightsWorkflowAgent');
            agent = new InsightsWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'estimate':
            console.log('[agent][root] handing off to EstimateWorkflowAgent');
            agent = new EstimateWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'client':
            console.log('[agent][root] handing off to ClientWorkflowAgent');
            agent = new ClientWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'catalog':
            console.log('[agent][root] handing off to CatalogWorkflowAgent');
            agent = new CatalogWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'payment':
            console.log('[agent][root] handing off to PaymentWorkflowAgent');
            agent = new PaymentWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'expense':
            console.log('[agent][root] handing off to ExpenseWorkflowAgent');
            agent = new ExpenseWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
          case 'invoice':
          default:
            console.log('[agent][root] handing off to InvoiceWorkflowAgent');
            agent = new InvoiceWorkflowAgent({ language: agentLanguage, chatCtx: seededChatCtx });
            break;
        }

        return llm.handoff({ agent });
      },
    });

    super({
      instructions: getRootInstructions(language),
      tools: {
        ...sharedInsightTools,
        routeToWorkflow,
      },
    });
  }

  override async onEnter(): Promise<void> {
    console.log('[agent][root] onEnter: starting first turn');
    const handle = this.session.generateReply();
    await handle.waitForPlayout();
  }
}

/**
 * Backwards-compatible alias used by existing tests.
 */
export class Agent extends AddInvoicesRootAgent {
  constructor() {
    super({ language: 'en' });
  }
}
