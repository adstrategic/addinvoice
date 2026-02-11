"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { InvoiceCard } from "./InvoiceCard";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { mapStatusToUI } from "../types/api";

interface InvoiceListProps {
  invoices: InvoiceResponse[];
  activeTab: string;
  onView: (sequence: number | string) => void;
  onEdit: (sequence: number) => void;
  onDownload: (invoice: InvoiceResponse) => void;
  onSend: (invoice: InvoiceResponse) => void;
  onAddPayment: (invoice: InvoiceResponse) => void;
  onDelete: (invoice: InvoiceResponse) => void;
  children?: React.ReactNode;
}

/**
 * Invoice list component
 * Displays a list of invoices with tab title
 */
export function InvoiceList({
  invoices,
  activeTab,
  onView,
  onEdit,
  onDownload,
  onSend,
  onAddPayment,
  onDelete,
  children,
}: InvoiceListProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case "all":
        return "All Invoices";
      case "emitted":
        return "Emitted Invoices";
      case "paid":
        return "Paid Invoices";
      case "pending":
        return "Pending Invoices";
      case "drafts":
        return "Draft Invoices";
      default:
        return "All Invoices";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
            {getTabTitle()}
            {invoices.length > 0 && ` (${invoices.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
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
                  onView={onView}
                  onEdit={onEdit}
                  onDownload={onDownload}
                  onSend={onSend}
                  onAddPayment={onAddPayment}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
