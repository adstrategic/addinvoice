const QA_DB: Record<string, string> = {
  invoice:
    "You can create invoices manually from the Invoices page, or use the voice button (mic icon) to describe your invoice out loud. Once created, you can download it as PDF, send it by email, or record a payment.",
  voice:
    "The voice assistant lets you create invoices, estimates, clients, and catalog items by simply speaking. Look for the mic button on each module page — tap it and describe what you need.",
  payment:
    "Go to Payments to track all incoming payments. You can also set up Stripe, PayPal, Zelle, or Nequi in Configuration → Payments to let clients pay directly.",
  product:
    "Add products and services in the Catalog section. Once added, they auto-complete when you create invoices or estimates, saving you time.",
  catalog:
    "The Catalog is your library of products and services. Add items once and they'll be available to select whenever you create invoices or estimates.",
  company:
    "Go to Configuration to set up your company details including name, logo, address, and tax ID. This information appears on all your invoices.",
  clients:
    "Manage your clients in the Clients section. You can add them manually or use the voice button. Once added, clients are linked to your invoices and estimates.",
  quotes:
    "Create estimates (quotes) in the Estimates section. You can do it manually or by voice. Once a client accepts, use the action menu to convert the estimate into a proposal.",
  estimates:
    "Create estimates in the Estimates section — manually or by voice. After a client accepts, convert the estimate to a proposal using the action menu on the estimate row.",
  proposals:
    "Proposals are created from accepted estimates. Go to Estimates, find an accepted estimate, and use the action menu to convert it to a proposal. From the Proposals section you can send it, mark it accepted, or convert it to an invoice.",
  expenses:
    "Track your business expenses in the Expenses section. Add them manually with the create button. You can filter and search your expense history for accounting purposes.",
  configuration:
    "The Configuration page lets you manage your company info, user profile, subscription plan, and payment methods. You can also set the language for the voice assistant.",
  hello: "Hello! I'm here to help. Ask me anything about ADDINVOICES.",
  help: "You can ask me about invoices, estimates, proposals, expenses, clients, payments, the catalog, your company settings, or the voice assistant. What would you like to know?",
};

export function findAnswer(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [keyword, answer] of Object.entries(QA_DB)) {
    if (lower.includes(keyword)) return answer;
  }
  return null;
}
