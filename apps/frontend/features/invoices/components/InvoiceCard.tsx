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
  FileText,
  Plus,
  Ban,
  Calendar,
} from "lucide-react";
import { canVoidInvoice } from "@/lib/document-void";
import { canSendInvoice } from "@/lib/is-document-public-issued";
import Link from "next/link";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { mapStatusToUI } from "../types/api";
import { formatCurrency } from "@/lib/utils";
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

interface InvoiceCardProps {
  invoice: InvoiceResponse;
  index: number;
  onDownload: (invoice: InvoiceResponse) => void;
  onSend: (invoice: InvoiceResponse) => void;
  onAddPayment: (invoice: InvoiceResponse) => void;
  onDelete: (invoice: InvoiceResponse) => void;
  onVoid?: (invoice: InvoiceResponse) => void;
  linkOnly?: boolean;
}

function formatCardDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoiceCard({
  invoice,
  index,
  onDownload,
  onSend,
  onAddPayment,
  onDelete,
  onVoid = () => {},
  linkOnly = false,
}: InvoiceCardProps) {
  const router = useRouter();

  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(invoice.client);
  const uiStatus = mapStatusToUI(invoice.status);
  const hasBalance = (invoice.balance ?? 0) > 0;
  const isVoided = invoice.status === "VOIDED";
  const showSend = canSendInvoice(invoice);
  const canAddPayment = !isVoided && uiStatus !== "paid" && hasBalance;
  const showVoid = canVoidInvoice(invoice);
  const dueDateLabel = formatCardDate(invoice.dueDate);
  const isOverdue = uiStatus === "overdue";

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
          onClick={() => router.push(`/invoices/${invoice.sequence}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        {invoice.status === "DRAFT" && (
          <DropdownMenuItem
            onClick={() => router.push(`/invoices/${invoice.sequence}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDownload(invoice)}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        {showSend && (
          <DropdownMenuItem onClick={() => onSend(invoice)}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </DropdownMenuItem>
        )}
        {canAddPayment && (
          <DropdownMenuItem onClick={() => onAddPayment(invoice)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </DropdownMenuItem>
        )}
        {invoice.status === "DRAFT" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(invoice)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
        {showVoid && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onVoid(invoice)}
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
    <ListCard variant="invoice">
      <ListCardBody>
        <ListCardMain icon={FileText} variant="invoice">
          <ListCardHeaderRow
            title={invoice.invoiceNumber}
            badge={
              <DocumentStatusBadge
                uiStatus={uiStatus}
                documentType="invoice"
              />
            }
            actions={actionsMenu}
          >
            <ListCardSubtitle>{clientName}</ListCardSubtitle>
            {clientBusinessName && (
              <ListCardMeta>{clientBusinessName}</ListCardMeta>
            )}
          </ListCardHeaderRow>

          <ListCardMetricGrid
            variant="invoice"
            metrics={[
              {
                label: "Total",
                value: formatCurrency(invoice.total),
              },
              {
                label: "Balance",
                value: formatCurrency(invoice.balance),
                valueClassName:
                  invoice.balance <= 0 ? "text-green-600" : "text-red-600",
              },
            ]}
          />
        </ListCardMain>

        <ListCardMetricsDesktop
          metrics={[
            {
              label: "Total",
              value: formatCurrency(invoice.total),
            },
            {
              label: "Balance",
              value: formatCurrency(invoice.balance),
              valueClassName:
                invoice.balance <= 0 ? "text-green-600" : "text-red-600",
            },
          ]}
          actions={actionsMenu}
        />
      </ListCardBody>

      <ListCardFooter
        variant="invoice"
        icon={Calendar}
        iconClassName={isOverdue ? "text-red-500" : undefined}
      >
        <ListCardFooterLabel>Due</ListCardFooterLabel>
        <ListCardFooterValue className={isOverdue ? "text-red-600" : undefined}>
          {dueDateLabel}
        </ListCardFooterValue>
      </ListCardFooter>
    </ListCard>
  );

  if (linkOnly) {
    return (
      <Link href={`/invoices/${invoice.sequence}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
