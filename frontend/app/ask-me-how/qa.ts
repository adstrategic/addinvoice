/** Static keyword → answer map for the Ask Me How help assistant. */
export const QA_DB: Record<string, string> = {
  invoice:
    "To create an invoice, click the '+' button on the dashboard or go to the Invoices page. You can also use 'Invoice by Voice' to dictate it!",
  voice:
    "Our Voice features allow you to create invoices, add expenses, and manage your catalog just by speaking. Look for the microphone icon in relevant sections.",
  payment:
    "Payments are tracked in the Payments module. You can mark invoices as paid manually or connect Stripe for automatic processing.",
  product:
    "Add products in the Catalog section. Once added, they will auto-complete when you type their name in an invoice.",
  catalog:
    "Add products and services in the Catalog page. They will auto-complete when creating invoices. You can filter by company if you manage multiple businesses.",
  company:
    "You can manage multiple companies in Configuration > Company Settings.",
  clients:
    "Manage clients in the Clients section. Add contact info, addresses, and use them when creating invoices.",
  quotes:
    "Generate quotes for potential clients from the Quotes page. Once accepted, you can convert them to invoices.",
  expenses:
    "Record business expenses in the Expenses section. Track spending by category and date.",
  configuration:
    "Configure your companies, user profile, billing, and notification preferences in Configuration.",
  hello:
    "Hi there! I'm here to help you use AddInvoices. Ask me anything about creating invoices, payments, or voice features.",
  help: "I can help with Invoices, Payments, Catalog, Clients, Quotes, Expenses, and Configuration. What do you need to know?",
};

export function findAnswer(query: string): string {
  const lowerQuery = query.toLowerCase();
  for (const [key, answer] of Object.entries(QA_DB)) {
    if (lowerQuery.includes(key)) return answer;
  }
  return "I'm not sure about that yet, but I'm learning! You can try asking about 'invoices', 'payments', 'catalog', or 'configuration'.";
}
