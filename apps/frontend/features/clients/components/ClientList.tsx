"use client";

import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientCard } from "./ClientCard";
import type { ClientResponse } from "@addinvoice/schemas";
import { cn } from "@/lib/utils";

interface ClientListProps {
  clients: ClientResponse[];
  isLoading?: boolean;
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onSendEmail: (client: ClientResponse) => void;
  onDelete: (client: ClientResponse) => void;
  children?: React.ReactNode;
}

function ClientListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading clients">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ClientList({
  clients,
  isLoading = false,
  onViewDetails,
  onEdit,
  onSendEmail,
  onDelete,
  children,
}: ClientListProps) {
  return (
    <div
      data-tour-id="clients-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <ClientListSkeleton />
      ) : clients.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client, index) => (
            <ClientCard
              key={client.id}
              client={client}
              index={index}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onSendEmail={onSendEmail}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
