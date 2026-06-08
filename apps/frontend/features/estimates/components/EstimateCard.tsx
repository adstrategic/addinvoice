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
  Edit,
  Download,
  Send,
  Trash2,
  FileCheck,
  CheckCircle,
  Receipt,
  ScrollText,
  ExternalLink,
  Ban,
  Calendar,
} from "lucide-react";
import { canVoidEstimate } from "@/lib/document-void";
import { canSendEstimate } from "@/lib/is-document-public-issued";
import Link from "next/link";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import { formatCurrency, cn } from "@/lib/utils";
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

interface EstimateCardProps {
  estimate: EstimateDashboardResponse;
  index: number;
  onDownload: (estimate: EstimateDashboardResponse) => void;
  onSend: (estimate: EstimateDashboardResponse) => void;
  onDelete: (estimate: EstimateDashboardResponse) => void;
  onVoid: (estimate: EstimateDashboardResponse) => void;
  onAccept?: (estimate: EstimateDashboardResponse) => void;
  onConvertToInvoice?: (estimate: EstimateDashboardResponse) => void;
  onConvertToProposal?: (estimate: EstimateDashboardResponse) => void;
  linkOnly?: boolean;
}

function formatCardDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EstimateCard({
  estimate,
  index,
  onDownload,
  onSend,
  onDelete,
  onVoid,
  onAccept,
  onConvertToInvoice,
  onConvertToProposal,
  linkOnly = false,
}: EstimateCardProps) {
  const router = useRouter();
  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(estimate.client);
  const uiStatus = mapStatusToUI(estimate.status);
  const footerDate = estimate.sentAt
    ? { label: "Sent", value: formatCardDate(estimate.sentAt) }
    : { label: "Created", value: formatCardDate(estimate.createdAt) };

  const actionsMenu = !linkOnly ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/estimates/${estimate.sequence}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        {estimate.status === "PROPOSAL" && estimate.proposalSequence && (
          <DropdownMenuItem
            onClick={() =>
              router.push(`/proposals/${estimate.proposalSequence}`)
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Proposal
          </DropdownMenuItem>
        )}
        {(estimate.status === "DRAFT" || estimate.status === "REJECTED") && (
          <DropdownMenuItem
            onClick={() => router.push(`/estimates/${estimate.sequence}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDownload(estimate)}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        {canSendEstimate(estimate) && (
          <DropdownMenuItem onClick={() => onSend(estimate)}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </DropdownMenuItem>
        )}
        {(estimate.status === "SENT" || estimate.status === "VIEWED") &&
          onAccept && (
            <DropdownMenuItem onClick={() => onAccept(estimate)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as accepted
            </DropdownMenuItem>
          )}
        {estimate.status === "ACCEPTED" && onConvertToProposal && (
          <DropdownMenuItem onClick={() => onConvertToProposal(estimate)}>
            <ScrollText className="h-4 w-4 mr-2" />
            Convert to Proposal
          </DropdownMenuItem>
        )}
        {estimate.status === "ACCEPTED" && onConvertToInvoice && (
          <DropdownMenuItem onClick={() => onConvertToInvoice(estimate)}>
            <Receipt className="h-4 w-4 mr-2" />
            Convert to Invoice
          </DropdownMenuItem>
        )}
        {estimate.status === "DRAFT" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(estimate)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
        {canVoidEstimate(estimate) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onVoid(estimate)}
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
    <ListCard variant="estimate">
      <ListCardBody>
        <ListCardMain icon={FileCheck} variant="estimate">
          <ListCardHeaderRow
            title={estimate.estimateNumber}
            badge={
              <DocumentStatusBadge
                uiStatus={uiStatus}
                documentType="estimate"
              />
            }
            actions={actionsMenu}
          >
            <ListCardSubtitle>{clientName}</ListCardSubtitle>
            {clientBusinessName && (
              <ListCardMeta>{clientBusinessName}</ListCardMeta>
            )}
          </ListCardHeaderRow>

          {estimate.status === "REJECTED" &&
            estimate.rejectionReason?.trim() && (
              <p
                className="text-xs text-muted-foreground mt-2 line-clamp-2"
                title={estimate.rejectionReason}
              >
                Rejection reason: {estimate.rejectionReason}
              </p>
            )}

          <ListCardMetricGrid
            variant="estimate"
            metrics={[
              {
                label: "Total",
                value: formatCurrency(estimate.total),
              },
            ]}
          />
        </ListCardMain>

        <ListCardMetricsDesktop
          metrics={[
            {
              label: "Total",
              value: formatCurrency(estimate.total),
            },
          ]}
          actions={actionsMenu}
        />
      </ListCardBody>

      <ListCardFooter variant="estimate" icon={Calendar}>
        <ListCardFooterLabel>{footerDate.label}</ListCardFooterLabel>
        <ListCardFooterValue>{footerDate.value}</ListCardFooterValue>
      </ListCardFooter>
    </ListCard>
  );

  if (linkOnly) {
    return (
      <Link href={`/estimates/${estimate.sequence}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
