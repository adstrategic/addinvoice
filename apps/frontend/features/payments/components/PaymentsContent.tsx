"use client";

import { useState, useEffect } from "react";
import { usePayments } from "../hooks/usePayments";
import { PaymentList } from "./PaymentList";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, CreditCard } from "lucide-react";
import LoadingComponent from "@/components/loading-component";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const [businessIdFilter, setBusinessIdFilter] = useState<string>("all");
  const router = useRouter();

  const {
    data: paymentsData,
    isLoading,
    error,
  } = usePayments({
    page: currentPage,
    search: debouncedSearch || undefined,
    businessId:
      businessIdFilter === "all" ? undefined : parseInt(businessIdFilter, 10),
  });

  if (isLoading) {
    return (
      <div className=" container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentsData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading payments. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payments = paymentsData.data;
  const pagination = paymentsData.pagination;
  const totalAmount = paymentsData.totalAmount;

  return (
    <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Payments
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View all payments received
          </p>
        </div>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card
          data-tour-id="payments-balance"
          className="bg-card border-border hover:border-primary/50 transition-all duration-300"
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Total received</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total in workspace
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Payments count</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">
              {paymentsData.totalCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total in workspace
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DashboardBusinessFilter
            businessId={businessIdFilter}
            onBusinessIdChange={setBusinessIdFilter}
          />
        </div>
      </motion.div>

      <div data-tour-id="payments-history">
        <PaymentList
          payments={payments}
          onView={(id) => router.push(`/payments/${id}`)}
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
