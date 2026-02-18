import type { Client, ClientWithStats } from "@/features/clients";

interface Invoice {
  clientName?: string;
  total?: number;
}

/**
 * Calculate client statistics from invoices
 * TODO: Replace with backend API call when ready
 */
export function calculateClientStats(
  clients: Client[],
  invoices: Invoice[]
): ClientWithStats[] {
  return clients.map((client) => {
    const clientInvoices = invoices.filter(
      (inv) => inv.clientName?.toLowerCase() === client.name.toLowerCase()
    );

    const totalInvoices = clientInvoices.length;
    const totalAmount = clientInvoices.reduce((sum, inv) => {
      return sum + (inv.total || 0);
    }, 0);

    return {
      ...client,
      totalInvoices,
      totalAmount,
      status: "active", // TODO: Add status field to client model
    };
  });
}
