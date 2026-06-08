"use client";

import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/shared/DocumentStatusBadge";
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  Receipt,
  Loader2,
  CheckCircle,
  ScrollText,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendEstimateDialog } from "@/components/send-estimate-dialog";
import { ConvertToProposalDialog } from "@/components/convert-to-proposal-dialog";
import {
  useEstimateBySequence,
  useEstimateDelete,
  useEstimateVoid,
  useEstimateActions,
  useMarkEstimateAsAccepted,
  mapStatusToUI,
} from "@/features/estimates";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { canSendEstimate } from "@/lib/is-document-public-issued";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { canVoidEstimate } from "@/lib/document-void";
import { toast } from "sonner";
import { useDownloadEstimatePdf } from "@/features/estimates/hooks/useDownloadEstimatePDF";
import { EstimatePdfPreview } from "@/features/estimates/components/EstimatePdfPreview";
import { DetailPageLoading } from "@/components/loading-component";

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [convertToProposalDialogOpen, setConvertToProposalDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const estimateDelete = useEstimateDelete({
    onAfterDelete: () => {
      router.push("/estimates");
    },
  });
  const estimateVoid = useEstimateVoid();
  const estimateActions = useEstimateActions();
  const markAsAccepted = useMarkEstimateAsAccepted();

  const sequence = params?.sequence
    ? parseInt(params.sequence as string)
    : null;

  const {
    data: estimate,
    isLoading,
    error,
  } = useEstimateBySequence(sequence, sequence !== null);

  const downloadPdf = useDownloadEstimatePdf();

  if (isLoading) return <DetailPageLoading />

  if (error || !estimate) {
    return (
      <div className="max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto">
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
                <DocumentStatusBadge
                  uiStatus={uiStatus}
                  documentType="estimate"
                  size="md"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                PDF preview
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 shrink-0 bg-transparent"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download className="h-4 w-4 shrink-0" />
              Download PDF
            </Button>
            {(estimate.status === "DRAFT" ||
              estimate.status === "REJECTED") && (
              <Link href={`/estimates/${sequence}/edit`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 shrink-0 bg-transparent"
                >
                  <Edit className="h-4 w-4 shrink-0" />
                  Edit
                </Button>
              </Link>
            )}
            {estimate.status === "DRAFT" && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
                onClick={() =>
                  estimate && estimateDelete.openDeleteModal(estimate)
                }
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete
              </Button>
            )}
            {canSendEstimate({
              status: estimate.status,
              itemCount: items.length,
            }) && (
              <Button
                size="lg"
                className="gap-2 shrink-0"
                onClick={() => setSendDialogOpen(true)}
              >
                <Send className="h-4 w-4 shrink-0" />
                Send
              </Button>
            )}
            {estimate.status === "SENT" && (
              <Button
                size="lg"
                className="gap-2 shrink-0"
                onClick={() => markAsAccepted.mutate(estimate.id)}
                disabled={markAsAccepted.isPending}
              >
                {markAsAccepted.isPending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                )}
                {markAsAccepted.isPending
                  ? "Accepting…"
                  : "Mark as accepted"}
              </Button>
            )}
            {estimate.status === "ACCEPTED" && (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 shrink-0"
                  onClick={() => setConvertToProposalDialogOpen(true)}
                >
                  <ScrollText className="h-4 w-4 shrink-0" />
                  Convert to Proposal
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 shrink-0"
                  onClick={() =>
                    estimateActions.handleConvertToInvoice(estimate)
                  }
                  disabled={estimateActions.isConvertingToInvoice}
                >
                  {estimateActions.isConvertingToInvoice ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4 shrink-0" />
                  )}
                  {estimateActions.isConvertingToInvoice
                    ? "Converting…"
                    : "Convert to Invoice"}
                </Button>
              </>
            )}
            {canVoidEstimate(estimate) && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
                onClick={() => estimateVoid.openVoidModal(estimate)}
              >
                <Ban className="h-4 w-4 shrink-0" />
                Mark as voided
              </Button>
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
        publicSlug={estimate.publicSlug}
      />

      <ConvertToProposalDialog
        open={convertToProposalDialogOpen}
        onOpenChange={setConvertToProposalDialogOpen}
        estimateSequence={sequence!}
        estimateNumber={estimate.estimateNumber}
        clientName={client.name || "Client"}
        clientEmail={estimate.clientEmail ?? undefined}
        requireSignature={estimate.requireSignature ?? true}
      />

      <EntityDeleteModal
        isOpen={estimateDelete.isDeleteModalOpen}
        onClose={estimateDelete.closeDeleteModal}
        onConfirm={estimateDelete.handleDeleteConfirm}
        entity="estimate"
        entityName={estimateDelete.estimateToDelete?.estimateNumber || ""}
        isDeleting={estimateDelete.isDeleting}
      />

      <EntityVoidModal
        isOpen={estimateVoid.isVoidModalOpen}
        onClose={estimateVoid.closeVoidModal}
        onConfirm={estimateVoid.handleVoidConfirm}
        entity="estimate"
        entityName={estimateVoid.estimateToVoid?.estimateNumber || ""}
        isVoiding={estimateVoid.isVoiding}
      />
    </>
  );
}
