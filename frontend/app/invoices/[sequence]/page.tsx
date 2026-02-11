"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Send, Edit, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadInvoicePdf } from "@/features/invoices/lib/utils";
import { useInvoiceBySequence } from "@/features/invoices/hooks/useInvoices";
import { PaymentFormDialog } from "@/features/invoices/components/PaymentFormDialog";
import { PaymentsSection } from "@/features/invoices/forms/form-fields/PaymentsSection";
import { useInvoiceDelete } from "@/features/invoices/hooks/useInvoiceDelete";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { mapStatusToUI } from "@/features/invoices/types/api";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  pending: { label: "Pending", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceDelete = useInvoiceDelete({
    onAfterDelete: () => {
      router.push("/invoices");
    },
  });

  const sequence = params?.sequence
    ? parseInt(params.sequence as string)
    : null;

  const {
    data: invoice,
    isLoading,
    error,
  } = useInvoiceBySequence(sequence, sequence !== null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </div>
    );
  }

  const client = invoice.client;
  const uiStatus = mapStatusToUI(invoice.status);

  const handleDownloadPDF = async () => {
    if (!sequence) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(sequence, invoice.invoiceNumber, toast);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {invoice.invoiceNumber}
                </h1>
                <Badge
                  className={
                    statusConfig[uiStatus as keyof typeof statusConfig]
                      ?.className || "bg-muted text-muted-foreground"
                  }
                >
                  {statusConfig[uiStatus as keyof typeof statusConfig]?.label ||
                    uiStatus}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Invoice details and information
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
            {invoice.status === "DRAFT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/invoices/${sequence}/edit`}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-transparent"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit invoice</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive bg-transparent"
                  onClick={() =>
                    invoice && invoiceDelete.openDeleteModal(invoice)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete invoice</p>
              </TooltipContent>
            </Tooltip>
            {invoice.status !== "DRAFT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Payment
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add payment</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setSendDialogOpen(true)}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send invoice</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Invoice Preview */}

        {invoice.status !== "DRAFT" && (
          <div className="mt-6">
            <PaymentsSection
              invoiceId={invoice.id}
              payments={invoice.payments ?? []}
              invoiceTotal={Number(invoice.total)}
              invoiceSequence={invoice.sequence}
            />
          </div>
        )}
      </div>

      <PaymentFormDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoiceId={invoice.id}
        invoiceSequence={invoice.sequence}
      />

      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoiceSequence={sequence!}
        invoiceNumber={invoice.invoiceNumber}
        clientName={client?.name || "Client"}
        clientEmail={client?.email}
      />

      <EntityDeleteModal
        isOpen={invoiceDelete.isDeleteModalOpen}
        onClose={invoiceDelete.closeDeleteModal}
        onConfirm={invoiceDelete.handleDeleteConfirm}
        entity="invoice"
        entityName={invoiceDelete.invoiceToDelete?.invoiceNumber || ""}
        isDeleting={invoiceDelete.isDeleting}
      />
    </>
  );
}
