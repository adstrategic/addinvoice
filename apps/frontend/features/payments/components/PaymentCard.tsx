"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  MoreVertical,
  Eye,
  Download,
  Send,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { SendReceiptDialog } from "@/components/send-receipt-dialog";
import type { PaymentListResponse } from "../schemas/payments.schema";
import { toast } from "sonner";
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

interface PaymentCardProps {
  payment: PaymentListResponse;
  onView: (id: number) => void;
}

async function downloadReceiptPdf(
  paymentId: number,
  invoiceNumber: string,
): Promise<void> {
  const response = await fetch(`/api/payments/${paymentId}/receipt`);
  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${invoiceNumber}-${paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  toast.success("Receipt downloaded", {
    description: "The receipt PDF has been downloaded successfully.",
  });
}

function formatCardDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PaymentCard({ payment, onView }: PaymentCardProps) {
  const [sendReceiptOpen, setSendReceiptOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(payment.invoice.client);
  const currency = payment.invoice.currency || "USD";

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPdf(payment.id, payment.invoice.invoiceNumber);
    } catch {
      toast.error("Failed to download receipt", {
        description: "Failed to download receipt",
      });
    } finally {
      setDownloading(false);
    }
  };

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors duration-200"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(payment.id)}>
          <FileText className="h-4 w-4 mr-2" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${payment.invoice.sequence}`}>
            <Eye className="h-4 w-4 mr-2" />
            View invoice
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadReceipt}
          disabled={downloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Downloading..." : "Download receipt"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSendReceiptOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Send receipt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ListCard clickable={false} variant="payment">
        <ListCardBody>
          <ListCardMain icon={DollarSign} variant="payment">
            <ListCardHeaderRow
              title={
                <Link
                  href={`/invoices/${payment.invoice.sequence}`}
                  className="hover:underline"
                >
                  {payment.invoice.invoiceNumber}
                </Link>
              }
              actions={actionsMenu}
            >
              <ListCardSubtitle>{clientName}</ListCardSubtitle>
              {clientBusinessName && (
                <ListCardMeta>{clientBusinessName}</ListCardMeta>
              )}
              {payment.transactionId && (
                <ListCardMeta>Ref: {payment.transactionId}</ListCardMeta>
              )}
            </ListCardHeaderRow>

            <ListCardMetricGrid
              variant="payment"
              metrics={[
                {
                  label: "Amount",
                  value: formatAmount(payment.amount),
                },
                {
                  label: "Method",
                  value: payment.paymentMethod,
                  valueClassName: "font-sans text-sm",
                },
              ]}
            />
          </ListCardMain>

          <ListCardMetricsDesktop
            metrics={[
              {
                label: "Amount",
                value: formatAmount(payment.amount),
              },
            ]}
            actions={actionsMenu}
          />
        </ListCardBody>

        <ListCardFooter variant="payment" icon={Calendar}>
          <ListCardFooterLabel>Paid</ListCardFooterLabel>
          <ListCardFooterValue>
            {formatCardDate(payment.paidAt)}
          </ListCardFooterValue>
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
            {payment.paymentMethod}
          </span>
        </ListCardFooter>
      </ListCard>

      <SendReceiptDialog
        open={sendReceiptOpen}
        onOpenChange={setSendReceiptOpen}
        paymentId={payment.id}
        invoiceNumber={payment.invoice.invoiceNumber}
        clientName={clientName}
        clientEmail={payment.invoice.clientEmail ?? undefined}
      />
    </>
  );
}
