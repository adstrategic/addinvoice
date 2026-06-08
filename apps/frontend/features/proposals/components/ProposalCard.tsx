"use client";

import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/shared/DocumentStatusBadge";
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
  ScrollText,
  CheckCircle,
  Receipt,
  Ban,
  Calendar,
} from "lucide-react";
import { canVoidProposal } from "@/lib/document-void";
import { canSendProposalFromList } from "@/lib/is-document-public-issued";
import Link from "next/link";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";
import { formatCurrency } from "@/lib/utils";
import { mapStatusToUI } from "../types/api";
import { useRouter } from "next/navigation";
import {
  ListCard,
  ListCardBody,
  ListCardMain,
  ListCardHeaderRow,
  ListCardSubtitle,
  ListCardMeta,
  ListCardMetricGrid,
  ListCardMetricsDesktop,
  ListCardFooter,
  ListCardFooterLabel,
  ListCardFooterValue,
  getClientDisplayLines,
} from "@/components/shared/list-card";

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

function formatCardDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(proposal.client);
  const uiStatus = mapStatusToUI(proposal.status);
  const footerDate = proposal.sentAt
    ? { label: "Sent", value: formatCardDate(proposal.sentAt) }
    : { label: "Created", value: formatCardDate(proposal.createdAt) };

  const actionsMenu = !linkOnly ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-violet-500/10 hover:text-violet-600 transition-colors duration-200"
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
  ) : null;

  const cardContent = (
    <ListCard variant="proposal">
      <ListCardBody>
        <ListCardMain icon={ScrollText} variant="proposal">
          <ListCardHeaderRow
            title={proposal.proposalNumber}
            badge={
              <DocumentStatusBadge
                uiStatus={uiStatus}
                documentType="proposal"
              />
            }
            actions={actionsMenu}
          >
            <ListCardSubtitle>{clientName}</ListCardSubtitle>
            {clientBusinessName && (
              <ListCardMeta>{clientBusinessName}</ListCardMeta>
            )}
          </ListCardHeaderRow>

          {proposal.status === "REJECTED" &&
            proposal.rejectionReason?.trim() && (
              <p
                className="text-xs text-muted-foreground mt-2 line-clamp-2"
                title={proposal.rejectionReason}
              >
                Rejection reason: {proposal.rejectionReason}
              </p>
            )}

          <ListCardMetricGrid
            variant="proposal"
            metrics={[
              {
                label: "Total",
                value: formatCurrency(proposal.total),
              },
            ]}
          />
        </ListCardMain>

        <ListCardMetricsDesktop
          metrics={[
            {
              label: "Total",
              value: formatCurrency(proposal.total),
            },
          ]}
          actions={actionsMenu}
        />
      </ListCardBody>

      <ListCardFooter variant="proposal" icon={Calendar}>
        <ListCardFooterLabel>{footerDate.label}</ListCardFooterLabel>
        <ListCardFooterValue>{footerDate.value}</ListCardFooterValue>
      </ListCardFooter>
    </ListCard>
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
