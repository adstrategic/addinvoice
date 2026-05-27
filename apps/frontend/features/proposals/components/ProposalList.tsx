"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { ProposalCard } from "./ProposalCard";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";

const STATUS_TO_TITLE: Record<string, string> = {
  all: "All Proposals",
  draft: "Draft Proposals",
  accepted: "Accepted Proposals",
  sent: "Sent Proposals",
  rejected: "Rejected Proposals",
};

interface ProposalListProps {
  proposals: ProposalDashboardResponse[];
  statusFilter: string;
  onDownload: (proposal: ProposalDashboardResponse) => void;
  onSend: (proposal: ProposalDashboardResponse) => void;
  onVoid: (proposal: ProposalDashboardResponse) => void;
  onAccept?: (proposal: ProposalDashboardResponse) => void;
  onConvertToInvoice?: (proposal: ProposalDashboardResponse) => void;
  children?: React.ReactNode;
}

/**
 * Proposal list component
 * Displays a list of proposals with title derived from status filter
 */
export function ProposalList({
  proposals,
  statusFilter,
  onDownload,
  onSend,
  onVoid,
  onAccept,
  onConvertToInvoice,
  children,
}: ProposalListProps) {
  const listTitle = STATUS_TO_TITLE[statusFilter] ?? STATUS_TO_TITLE.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card
        data-tour-id="proposals-list"
        className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
            {listTitle}
            {proposals.length > 0 && ` (${proposals.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No proposals found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal, index) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  index={index}
                  onDownload={onDownload}
                  onSend={onSend}
                  onVoid={onVoid}
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
