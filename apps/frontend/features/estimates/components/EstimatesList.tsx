"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { EstimateCard } from "./EstimateCard";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";

const STATUS_TO_TITLE: Record<string, string> = {
  all: "All Estimates",
  draft: "Draft Estimates",
  accepted: "Accepted Estimates",
  sent: "Sent Estimates",
  rejected: "Rejected Estimates",
};

interface EstimateListProps {
  estimates: EstimateDashboardResponse[];
  statusFilter: string;
  onDownload: (estimate: EstimateDashboardResponse) => void;
  onSend: (estimate: EstimateDashboardResponse) => void;
  onDelete: (estimate: EstimateDashboardResponse) => void;
  onAccept?: (estimate: EstimateDashboardResponse) => void;
  onConvertToInvoice?: (estimate: EstimateDashboardResponse) => void;
  children?: React.ReactNode;
}

/**
 * Estimate list component
 * Displays a list of estimates with title derived from status filter
 */
export function EstimateList({
  estimates,
  statusFilter,
  onDownload,
  onSend,
  onDelete,
  onAccept,
  onConvertToInvoice,
  children,
}: EstimateListProps) {
  const listTitle = STATUS_TO_TITLE[statusFilter] ?? STATUS_TO_TITLE.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card
        data-tour-id="estimates-list"
        className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
            {listTitle}
            {estimates.length > 0 && ` (${estimates.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No estimates found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {estimates.map((estimate, index) => (
                <EstimateCard
                  key={estimate.id}
                  estimate={estimate}
                  index={index}
                  onDownload={onDownload}
                  onSend={onSend}
                  onDelete={onDelete}
                  onAccept={onAccept}
                  onConvertToInvoice={onConvertToInvoice}
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
