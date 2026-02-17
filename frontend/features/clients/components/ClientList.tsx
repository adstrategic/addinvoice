"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText } from "lucide-react";
import { ClientCard } from "./ClientCard";
import type { ClientResponse } from "@/features/clients";

interface ClientListProps {
  clients: ClientResponse[];
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  // onViewInvoices: (client: ClientResponse) => void;
  onSendEmail: (client: ClientResponse) => void;
  onDelete: (client: ClientResponse) => void;
  children: React.ReactNode;
}

/**
 * Client list component
 * Displays a list of clients with search results count
 */
export function ClientList({
  children,
  clients,
  onViewDetails,
  onEdit,
  // onViewInvoices,
  onSendEmail,
  onDelete,
}: ClientListProps) {
  return (
    <Card data-tour-id="clients-list" className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
          All Clients
          <span className="text-muted-foreground font-normal ml-2">
            ({clients.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.length == 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No clients found matching your filters
              </p>
            </div>
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                // onViewInvoices={onViewInvoices}
                onSendEmail={onSendEmail}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
