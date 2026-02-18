"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { PaymentCard } from "./PaymentCard";
import type { PaymentListResponse } from "../schemas/payments.schema";
import { TablePagination } from "@/components/TablePagination";

interface PaymentListProps {
  payments: PaymentListResponse[];
  onView: (sequence: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function PaymentList({
  payments,
  onView,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaymentListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
            Payments
            {payments.length > 0 && ` (${totalItems})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No payments found matching your filters
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    index={index}
                    onView={onView}
                  />
                ))}
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={onPageChange}
                emptyMessage="No payments found"
                itemLabel="payments"
              />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
