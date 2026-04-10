"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Send, Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
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
import { toast } from "sonner";
import { useDownloadInvoicePdf } from "@/features/invoices/hooks/useDownloadInvoicePDF";
import { InvoicePdfPreview } from "@/features/invoices/components/InvoicePdfPreview";

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  overdue: { label: "Overdue", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const downloadPdf = useDownloadInvoicePdf();

  const {
    data: invoice,
    isLoading,
    error,
  } = useInvoiceBySequence(sequence, sequence !== null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </div>
    );
  }

  const client = invoice.client;
  const uiStatus = mapStatusToUI(invoice.status);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadPdf(invoice);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/invoices" className="shrink-0">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">
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
              <p className="text-muted-foreground mt-1 text-sm">
                PDF preview
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
            {invoice.paymentProvider === "stripe" &&
              invoice.paymentLink &&
              invoice.status !== "PAID" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={invoice.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <ExternalLink className="h-4 w-4" />
                        Stripe Payment Link
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open Stripe payment page</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
            {invoice.status === "DRAFT" && (
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
            )}
            {invoice.status !== "DRAFT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 sm:gap-2 bg-transparent shrink-0"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Add Payment</span>
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
                  className="gap-2 shrink-0"
                  size="sm"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send invoice</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {sequence !== null ? (
          <InvoicePdfPreview
            sequence={sequence}
            invoiceNumber={invoice.invoiceNumber}
          />
        ) : null}

        <div className="mt-6">
          <PaymentsSection
            invoiceId={invoice.id}
            payments={invoice.payments ?? []}
            invoiceTotal={Number(invoice.total)}
            invoiceSequence={invoice.sequence}
          />
        </div>
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
        clientEmail={invoice.clientEmail}
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
