"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  Receipt,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendEstimateDialog } from "@/components/send-estimate-dialog";
import {
  useEstimateBySequence,
  useEstimateDelete,
  useEstimateActions,
  mapStatusToUI,
} from "@/features/estimates";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { toast } from "sonner";
// import { enUS } from "date-fns/locale";
// import { format } from "date-fns";
import { useDownloadEstimatePdf } from "@/features/estimates/hooks/useDownloadEstimatePDF";

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  overdue: { label: "Overdue", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  accepted: {
    label: "Accepted",
    className: "bg-chart-2/20 text-chart-2",
  },
  sent: { label: "Sent", className: "bg-chart-3/20 text-chart-3" },
  rejected: { label: "Rejected", className: "bg-chart-4/20 text-chart-4" },
  invoiced: { label: "Invoiced", className: "bg-primary/20 text-primary" },
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

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const estimateDelete = useEstimateDelete({
    onAfterDelete: () => {
      router.push("/estimates");
    },
  });
  const estimateActions = useEstimateActions();

  const sequence = params?.sequence
    ? parseInt(params.sequence as string)
    : null;

  const {
    data: estimate,
    isLoading,
    error,
  } = useEstimateBySequence(sequence, sequence !== null);

  const downloadPdf = useDownloadEstimatePdf();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Estimate not found</p>
        </div>
      </div>
    );
  }

  const companyData = estimate.business!;
  const client = estimate.client;
  const items = estimate.items || [];
  const uiStatus = mapStatusToUI(estimate.status);

  const signatureData = estimate.signatureData as
    | Record<string, unknown>
    | null
    | undefined;
  const signatureImageUrl =
    typeof signatureData?.signatureImageUrl === "string"
      ? signatureData.signatureImageUrl
      : typeof signatureData?.signatureImage === "string"
        ? signatureData.signatureImage
        : null;
  const signatureFullName =
    typeof signatureData?.fullName === "string" ? signatureData.fullName : null;
  const signatureSignedAt =
    typeof signatureData?.signedAt === "string" ? signatureData.signedAt : null;
  const signatureSignedAtFallback = estimate.acceptedAt
    ? formatDateOnly(estimate.acceptedAt)
    : null;

  const handleDownloadPDF = async () => {
    try {
      await downloadPdf(estimate);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/estimates" className="shrink-0">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">
                  {estimate.estimateNumber}
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
                Estimate details and information
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
            {(estimate.status === "DRAFT" ||
              estimate.status === "REJECTED") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/estimates/${sequence}/edit`}>
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
                  <p>Edit estimate</p>
                </TooltipContent>
              </Tooltip>
            )}
            {estimate.status === "DRAFT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() =>
                      estimate && estimateDelete.openDeleteModal(estimate)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete estimate</p>
                </TooltipContent>
              </Tooltip>
            )}
            {items.length > 0 && (
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
                  <p>Send estimate</p>
                </TooltipContent>
              </Tooltip>
            )}
            {estimate.status === "ACCEPTED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      estimateActions.handleConvertToInvoice(estimate)
                    }
                    disabled={estimateActions.isConvertingToInvoice}
                    className="gap-2 shrink-0"
                    size="sm"
                    variant="secondary"
                  >
                    {estimateActions.isConvertingToInvoice ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Receipt className="h-4 w-4 shrink-0" />
                    )}
                    <span className="hidden sm:inline">
                      {estimateActions.isConvertingToInvoice
                        ? "Converting…"
                        : "Convert to Invoice"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Convert to invoice</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Estimate Preview */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <header className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  ESTIMATE
                </h1>

                <p className="text-sm font-semibold text-gray-400 mt-1">
                  # {estimate.estimateNumber}
                </p>
              </div>
              {/* 
              { max-height: 100%; width: auto; max-width: 100%; object-fit: contain; object-position: left center; display: block; }
                */}
              <div className="flex flex-1 items-center gap-6 justify-end">
                {companyData.logo && (
                  <div className="max-w-[320px] h-[120px] flex items-center shrink-0">
                    <img
                      src={companyData.logo}
                      alt="Company Logo"
                      className="object-contain max-w-full max-h-full block"
                    />
                  </div>
                )}
              </div>
            </header>
          </CardHeader>

          <CardContent className="pt-4 sm:pt-6 space-y-6 p-4 sm:p-6">
            {/* Bill To */}
            {client && (
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    BILL TO:
                  </h4>
                  <p className="font-semibold text-foreground">{client.name}</p>
                  {client.businessName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.businessName}
                    </p>
                  )}
                  {estimate.clientAddress && (
                    <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                      {estimate.clientAddress}
                    </p>
                  )}
                  {estimate.clientPhone && (
                    <p className="text-sm text-muted-foreground">
                      {estimate.clientPhone}
                    </p>
                  )}
                  {estimate.clientEmail && (
                    <p className="text-sm text-muted-foreground break-all">
                      {estimate.clientEmail}
                    </p>
                  )}
                  {client.nit && (
                    <p className="text-sm text-muted-foreground">
                      NIT: {client.nit}
                    </p>
                  )}
                </div>
                <div className="min-w-0 md:text-right">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    FROM:
                  </h4>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {companyData.name}
                  </h2>
                  {companyData.address && (
                    <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                      {companyData.address}
                    </p>
                  )}
                  {companyData.nit && (
                    <p className="text-sm text-muted-foreground">
                      NIT: {companyData.nit}
                    </p>
                  )}
                  {companyData.email && (
                    <p className="text-sm text-muted-foreground break-all">
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

            {/* Rejection reason (when REJECTED) */}
            {estimate.status === "REJECTED" &&
              estimate.rejectionReason?.trim() && (
                <div className="rounded-lg border border-chart-4/50 bg-chart-4/10 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Customer rejection reason
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {estimate.rejectionReason}
                  </p>
                </div>
              )}

            {/* summary */}
            {estimate.summary && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Project Summary:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {estimate.summary}
                  </p>
                </div>
              </div>
            )}

            {/* timeline */}
            {(estimate.timelineStartDate || estimate.timelineEndDate) && (
              <div className="overflow-hidden">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Timeline:
                  </h4>
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full border-l border-t border-r border-border h-2" />
                    <div className="flex justify-between w-full mt-2 text-sm text-muted-foreground">
                      {estimate.timelineStartDate && (
                        <span>
                          {/* {format(estimate.timelineStartDate, "PPP", {
                            locale: enUS,
                          })} */}
                          {formatDateOnly(estimate.timelineStartDate)}
                        </span>
                      )}
                      {estimate.timelineEndDate && (
                        <span>
                          {/* {format(estimate.timelineEndDate, "PPP", {
                            locale: enUS,
                          })} */}
                          {formatDateOnly(estimate.timelineEndDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table: horizontal scroll on small screens */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground">
                        Description
                      </th>
                      <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                        Qty
                      </th>
                      <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                        Unit Price
                      </th>
                      <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                        Tax
                      </th>
                      <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                        Discount
                      </th>
                      <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const itemDiscount = getItemFixedDiscount(item);
                      return (
                        <tr key={item.id} className="border-t border-border">
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-foreground max-w-[180px] sm:max-w-none">
                            <div>
                              <div
                                className="font-medium truncate"
                                title={item.name}
                              >
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                            {item.quantity} {item.quantityUnit}
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                            {estimate.currency} {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                            {item.tax}%
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-foreground whitespace-nowrap">
                            {formatCurrency(itemDiscount)}
                          </td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-right font-semibold text-foreground whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(estimate.subtotal)}
                  </span>
                </div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold text-foreground">
                      -
                      {estimate.discountType === "PERCENTAGE"
                        ? formatCurrency(
                            (estimate.discount * estimate.subtotal) / 100,
                          )
                        : formatCurrency(estimate.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(estimate.totalTax)}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(estimate.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature (when accepted) */}
            {estimate.status === "ACCEPTED" && signatureImageUrl && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Customer Signature
                </h4>
                {(signatureFullName || signatureSignedAt) && (
                  <div className="space-y-1 mb-3">
                    {signatureFullName && (
                      <p className="text-sm text-muted-foreground">
                        Signed by:{" "}
                        <span className="font-semibold text-foreground">
                          {signatureFullName}
                        </span>
                      </p>
                    )}
                    {signatureSignedAt && (
                      <p className="text-sm text-muted-foreground">
                        Signed at:{" "}
                        <span className="font-semibold text-foreground">
                          {formatDateOnly(signatureSignedAt)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                <img
                  src={signatureImageUrl}
                  alt="Customer signature"
                  className="w-full max-w-md border border-border rounded bg-white object-contain"
                />
              </div>
            )}

            {/* Notes and Terms */}
            {estimate.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Notes:
                </h4>
                <p className="text-sm text-muted-foreground">
                  {estimate.notes}
                </p>
              </div>
            )}

            {estimate.terms && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Terms & Conditions:
                </h4>
                <p className="text-sm text-muted-foreground">
                  {estimate.terms}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SendEstimateDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        estimateSequence={sequence!}
        estimateNumber={estimate.estimateNumber}
        clientName={client.name || "Client"}
        clientEmail={estimate.clientEmail}
      />

      <EntityDeleteModal
        isOpen={estimateDelete.isDeleteModalOpen}
        onClose={estimateDelete.closeDeleteModal}
        onConfirm={estimateDelete.handleDeleteConfirm}
        entity="estimate"
        entityName={estimateDelete.estimateToDelete?.estimateNumber || ""}
        isDeleting={estimateDelete.isDeleting}
      />
    </>
  );
}
