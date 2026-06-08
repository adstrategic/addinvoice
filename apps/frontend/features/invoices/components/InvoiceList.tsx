"use client";

import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceCard } from "./InvoiceCard";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { cn } from "@/lib/utils";

interface InvoiceListProps {
  invoices: InvoiceResponse[];
  isLoading?: boolean;
  onDownload: (invoice: InvoiceResponse) => void;
  onSend: (invoice: InvoiceResponse) => void;
  onAddPayment: (invoice: InvoiceResponse) => void;
  onDelete: (invoice: InvoiceResponse) => void;
  onVoid: (invoice: InvoiceResponse) => void;
  children?: React.ReactNode;
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading invoices">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function InvoiceList({
  invoices,
  isLoading = false,
  onDownload,
  onSend,
  onAddPayment,
  onDelete,
  onVoid,
  children,
}: InvoiceListProps) {
  return (
    <div
      data-tour-id="invoices-list"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <InvoiceListSkeleton />
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice, index) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              index={index}
              onDownload={onDownload}
              onSend={onSend}
              onAddPayment={onAddPayment}
              onDelete={onDelete}
              onVoid={onVoid}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
