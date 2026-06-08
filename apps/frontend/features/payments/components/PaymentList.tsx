"use client";

import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentCard } from "./PaymentCard";
import type { PaymentListResponse } from "../schemas/payments.schema";
import { cn } from "@/lib/utils";

interface PaymentListProps {
  payments: PaymentListResponse[];
  isLoading?: boolean;
  onView: (id: number) => void;
  children?: React.ReactNode;
}

function PaymentListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading payments">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PaymentList({
  payments,
  isLoading = false,
  onView,
  children,
}: PaymentListProps) {
  return (
    <div
      data-tour-id="payments-history"
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-70",
      )}
    >
      {isLoading ? (
        <PaymentListSkeleton />
      ) : payments.length === 0 ? (
        <div className="py-12 text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} onView={onView} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
