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
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { SendReceiptDialog } from "@/components/send-receipt-dialog";
import type { PaymentListResponse } from "../schemas/payments.schema";

interface PaymentCardProps {
  payment: PaymentListResponse;
  index: number;
  onView: (id: number) => void;
}

async function downloadReceiptPdf(
  paymentId: number,
  invoiceNumber: string,
  toast: (params: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void,
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
  toast({
    title: "Receipt downloaded",
    description: "The receipt PDF has been downloaded successfully.",
  });
}

export function PaymentCard({ payment, index, onView }: PaymentCardProps) {
  const { toast } = useToast();
  const [sendReceiptOpen, setSendReceiptOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const clientName =
    payment.invoice.client.name ||
    payment.invoice.client.businessName ||
    "Unknown Client";
  const businessName = payment.invoice.business.name;
  const currency = payment.invoice.currency || "USD";

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPdf(
        payment.id,
        payment.invoice.invoiceNumber,
        toast,
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.05 + index * 0.05,
      }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href={`/invoices/${payment.invoice.sequence}`}
              className="font-semibold text-foreground text-sm sm:text-base hover:underline"
            >
              {payment.invoice.invoiceNumber}
            </Link>
            <span className="text-sm text-muted-foreground">
              {payment.paymentMethod}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{clientName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {businessName}
          </p>
          {payment.transactionId && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Ref: {payment.transactionId}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {formatAmount(payment.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Paid: {new Date(payment.paidAt).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
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
      </div>
      <SendReceiptDialog
        open={sendReceiptOpen}
        onOpenChange={setSendReceiptOpen}
        paymentId={payment.id}
        invoiceNumber={payment.invoice.invoiceNumber}
        clientName={clientName}
        clientEmail={payment.invoice.clientEmail ?? undefined}
      />
    </motion.div>
  );
}
