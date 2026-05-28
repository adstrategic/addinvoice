"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Download,
  Send,
  FileText,
  CheckCircle,
  Receipt,
  Ban,
} from "lucide-react";
import { canVoidProposal } from "@/lib/document-void";
import { canSendProposalFromList } from "@/lib/is-document-public-issued";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";
import { formatCurrency } from "@/lib/utils";
import { mapStatusToUI } from "../types/api";
import { useRouter } from "next/navigation";

const statusConfig = {
  sent: {
    label: "Sent",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
  viewed: {
    label: "Viewed",
    className: "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20",
  },
  accepted: {
    label: "Accepted",
    className: "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  voided: {
    label: "Voided",
    className: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  },
};

interface ProposalCardProps {
  proposal: ProposalDashboardResponse;
  index: number;
  onDownload: (proposal: ProposalDashboardResponse) => void;
  onSend: (proposal: ProposalDashboardResponse) => void;
  onVoid: (proposal: ProposalDashboardResponse) => void;
  onAccept?: (proposal: ProposalDashboardResponse) => void;
  onConvertToInvoice?: (proposal: ProposalDashboardResponse) => void;
  linkOnly?: boolean;
}

/**
 * Individual proposal card component
 */
export function ProposalCard({
  proposal,
  index,
  onDownload,
  onSend,
  onVoid,
  onAccept,
  onConvertToInvoice,
  linkOnly = false,
}: ProposalCardProps) {
  const router = useRouter();
  const clientName =
    proposal.client?.name || proposal.client?.businessName || "Unknown Client";
  const businessName = proposal.business?.name;
  const uiStatus = mapStatusToUI(proposal.status);
  const statusInfo = statusConfig[uiStatus as keyof typeof statusConfig] || {
    label: uiStatus,
    className: "bg-muted text-muted-foreground",
  };

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.5 + index * 0.05,
      }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <p className="text-sm font-semibold text-muted-foreground truncate">
              {businessName}
            </p>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {proposal.proposalNumber}
            </p>
            <Badge variant="secondary" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{clientName}</p>
          {proposal.status === "REJECTED" &&
            proposal.rejectionReason?.trim() && (
              <p
                className="text-xs text-muted-foreground mt-1 line-clamp-2"
                title={proposal.rejectionReason}
              >
                Rejection reason: {proposal.rejectionReason}
              </p>
            )}
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {formatCurrency(proposal.total)}
          </p>
        </div>
        {!linkOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/proposals/${proposal.sequence}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(proposal)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              {canSendProposalFromList(proposal) && (
                <DropdownMenuItem onClick={() => onSend(proposal)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </DropdownMenuItem>
              )}
              {proposal.status === "SENT" && onAccept && (
                <DropdownMenuItem onClick={() => onAccept(proposal)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as accepted
                </DropdownMenuItem>
              )}
              {proposal.status === "ACCEPTED" && onConvertToInvoice && (
                <DropdownMenuItem onClick={() => onConvertToInvoice(proposal)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </DropdownMenuItem>
              )}
              {canVoidProposal(proposal) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onVoid(proposal)}
                    className="text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Mark as voided
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );

  if (linkOnly) {
    return (
      <Link href={`/proposals/${proposal.sequence}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
