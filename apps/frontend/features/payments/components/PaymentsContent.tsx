"use client";

import { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { PaymentStats } from "./PaymentStats";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentList } from "./PaymentList";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { useRouter } from "next/navigation";
import { TablePagination } from "@/components/TablePagination";

export default function PaymentsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");
  const router = useRouter();

  const {
    data: paymentsData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = usePayments({
    page: currentPage,
    search: debouncedSearch || undefined,
    businessId:
      businessIdFilter === "all" ? undefined : parseInt(businessIdFilter, 10),
  });

  const isInitialLoad = isLoading && !paymentsData;
  const isListLoading = isFetching && isPlaceholderData;

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !paymentsData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading payments.</p>
        </CardContent>
      </Card>
    );
  }

  const payments = paymentsData.data;
  const pagination = paymentsData.pagination;

  return (
    <div>
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Payments
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          View all payments received
        </p>
      </div>

      <PaymentStats
        totalReceived={paymentsData.totalAmount}
        paymentsCount={paymentsData.totalCount}
      />

      <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
        <PaymentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          businessId={businessIdFilter}
          onBusinessIdChange={setBusinessIdFilter}
        />

        <PaymentList
          payments={payments}
          isLoading={isListLoading}
          onView={(id) => router.push(`/payments/${id}`)}
        >
          {pagination && (
            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              onPageChange={setPage}
              emptyMessage="No payments found"
              itemLabel="payments"
            />
          )}
        </PaymentList>
      </div>
    </div>
  );
}
