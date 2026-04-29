"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { AdvanceCard } from "./AdvancesCard";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";

const STATUS_TO_TITLE: Record<string, string> = {
  all: "All Advances",
  draft: "Draft Advances",
  issued: "Issued Advances",
  invoiced: "Invoiced Advances",
};

interface AdvanceListProps {
  advances: AdvanceListItemResponse[];
  statusFilter: string;
  onDelete: (advance: AdvanceListItemResponse) => void;
  onSend: (advance: AdvanceListItemResponse) => void;
  children?: React.ReactNode;
}

/**
 * Advance list component
 * Displays a list of estimates with title derived from status filter
 */
export function AdvanceList({
  advances,
  statusFilter,
  onDelete,
  onSend,
  children,
}: AdvanceListProps) {
  const listTitle = STATUS_TO_TITLE[statusFilter] ?? STATUS_TO_TITLE.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground sm:text-xl">
            {listTitle}
            {advances.length > 0 && ` (${advances.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No advances found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {advances.map((advance, index) => (
                <AdvanceCard
                  key={advance.id}
                  advance={advance}
                  index={index}
                  onDelete={onDelete}
                  onSend={onSend}
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
