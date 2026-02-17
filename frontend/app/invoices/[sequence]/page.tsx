"use client";

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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  overdue: { label: "Overdue", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
};

function getItemFixedDiscount(item: {
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType?: string | null;
}): number {
  if (!item.discount || item.discountType === "NONE" || !item.discountType)
    return 0;
  const base = item.quantity * item.unitPrice;
  if (item.discountType === "PERCENTAGE") return (base * item.discount) / 100;
  if (item.discountType === "FIXED") return item.discount;
  return 0;
}

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

  const companyData = invoice.business!;
  const client = invoice.client;
  const items = invoice.items || [];
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
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {companyData.logo && (
                  <img
                    src={companyData.logo}
                    alt="Company Logo"
                    className="h-48 w-48 object-contain"
                  />
                )}
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-primary">INVOICE</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold">Invoice #:</span>{" "}
                  {invoice.invoiceNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Issue Date:</span>{" "}
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Due Date:</span>{" "}
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Bill To */}
            {client && (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    BILL TO:
                  </h4>
                  <p className="font-semibold text-foreground">{client.name}</p>
                  {client.businessName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.businessName}
                    </p>
                  )}
                  {invoice.clientAddress && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.clientAddress}
                    </p>
                  )}
                  {invoice.clientPhone && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.clientPhone}
                    </p>
                  )}
                  {invoice.clientEmail && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.clientEmail}
                    </p>
                  )}
                  {client.nit && (
                    <p className="text-sm text-muted-foreground">
                      NIT: {client.nit}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-foreground">
                    {companyData.name}
                  </h2>
                  {companyData.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {companyData.address}
                    </p>
                  )}
                  {companyData.nit && (
                    <p className="text-sm text-muted-foreground">
                      NIT: {companyData.nit}
                    </p>
                  )}
                  {companyData.email && (
                    <p className="text-sm text-muted-foreground">
                      {companyData.email}
                    </p>
                  )}
                  {companyData.phone && (
                    <p className="text-sm text-muted-foreground">
                      {companyData.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">
                      Description
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Qty
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Unit Price
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Tax
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Discount
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const itemDiscount = getItemFixedDiscount(item);
                    return (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-3 text-sm text-foreground">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-muted-foreground text-xs mt-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-right text-foreground">
                          {item.quantity} {item.quantityUnit}
                        </td>
                        <td className="p-3 text-sm text-right text-foreground">
                          {invoice.currency} {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-right text-foreground">
                          {item.tax}%
                        </td>
                        <td className="p-3 text-sm text-right text-foreground">
                          {formatCurrency(itemDiscount)}
                        </td>
                        <td className="p-3 text-sm text-right font-semibold text-foreground">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold text-foreground">
                      -
                      {invoice.discountType === "PERCENTAGE"
                        ? formatCurrency(
                            (invoice.discount * invoice.subtotal) / 100,
                          )
                        : formatCurrency(invoice.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoice.totalTax)}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method (same as PDF) */}
            {invoice.selectedPaymentMethod &&
              invoice.selectedPaymentMethod.isEnabled &&
              invoice.selectedPaymentMethod.handle?.trim() && (
                <div className="pt-4 border border-primary rounded-md p-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Payment method:{" "}
                  </span>
                  <span className="text-sm text-foreground">
                    {invoice.selectedPaymentMethod.type}{" "}
                    {invoice.selectedPaymentMethod.handle.trim()}
                  </span>
                </div>
              )}

            {/* Notes and Terms */}
            {invoice.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Notes:
                </h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {invoice.terms && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Terms & Conditions:
                </h4>
                <p className="text-sm text-muted-foreground">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>

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
        clientName={client.name || "Client"}
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
