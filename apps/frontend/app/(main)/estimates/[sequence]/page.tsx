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
import { toast } from "sonner";
import { useDownloadEstimatePdf } from "@/features/estimates/hooks/useDownloadEstimatePDF";
import { EstimatePdfPreview } from "@/features/estimates/components/EstimatePdfPreview";

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

  const client = estimate.client;
  const items = estimate.items || [];
  const uiStatus = mapStatusToUI(estimate.status);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadPdf(estimate);
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

        {sequence !== null ? (
          <EstimatePdfPreview
            sequence={sequence}
            estimateNumber={estimate.estimateNumber}
          />
        ) : null}
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
