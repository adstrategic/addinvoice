"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Send,
  Trash2,
  Receipt,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendProposalDialog } from "@/components/send-proposal-dialog";
import {
  useProposalBySequence,
  useProposalDelete,
  useProposalActions,
  useMarkProposalAsAccepted,
  mapStatusToUI,
} from "@/features/proposals";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useDownloadProposalPdf } from "@/features/proposals/hooks/useDownloadProposalPDF";

const ProposalPdfPreview = dynamic(
  () =>
    import("@/features/proposals/components/ProposalPdfPreview").then(
      (m) => m.ProposalPdfPreview,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] rounded-lg border border-border bg-card flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading PDF preview...</span>
        </div>
      </div>
    ),
  },
);

const statusConfig = {
  sent: { label: "Sent", className: "bg-chart-3/20 text-chart-3" },
  accepted: { label: "Accepted", className: "bg-chart-2/20 text-chart-2" },
  rejected: { label: "Rejected", className: "bg-chart-4/20 text-chart-4" },
  invoiced: { label: "Invoiced", className: "bg-primary/20 text-primary" },
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const proposalDelete = useProposalDelete({
    onAfterDelete: () => {
      router.push("/proposals");
    },
  });
  const proposalActions = useProposalActions();
  const markAsAccepted = useMarkProposalAsAccepted();

  const sequence = params?.sequence
    ? parseInt(params.sequence as string)
    : null;

  const {
    data: proposal,
    isLoading,
    error,
  } = useProposalBySequence(sequence, sequence !== null);

  const downloadPdf = useDownloadProposalPdf();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Proposal not found</p>
        </div>
      </div>
    );
  }

  const client = proposal.client;
  const uiStatus = mapStatusToUI(proposal.status);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadPdf(proposal);
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
            <Link href="/proposals" className="shrink-0">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">
                  {proposal.proposalNumber}
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
              <p className="text-muted-foreground mt-1 text-sm">PDF preview</p>
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
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>

            {proposal.status !== "INVOICED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() => proposalDelete.openDeleteModal(proposal)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete proposal</p>
                </TooltipContent>
              </Tooltip>
            )}

            {proposal.status === "REJECTED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setSendDialogOpen(true)}
                    className="gap-2 shrink-0"
                    size="sm"
                    disabled={proposalActions.isSending}
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resend proposal</p>
                </TooltipContent>
              </Tooltip>
            )}

            {proposal.status === "SENT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => markAsAccepted.mutate(proposal.id)}
                    disabled={markAsAccepted.isPending}
                    className="gap-2 shrink-0"
                    size="sm"
                    variant="secondary"
                  >
                    {markAsAccepted.isPending ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="hidden sm:inline">
                      {markAsAccepted.isPending ? "Accepting…" : "Mark Accepted"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark proposal as accepted</p>
                </TooltipContent>
              </Tooltip>
            )}

            {proposal.status === "ACCEPTED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      proposalActions.handleConvertToInvoice(proposal)
                    }
                    disabled={proposalActions.isConvertingToInvoice}
                    className="gap-2 shrink-0"
                    size="sm"
                    variant="secondary"
                  >
                    {proposalActions.isConvertingToInvoice ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Receipt className="h-4 w-4 shrink-0" />
                    )}
                    <span className="hidden sm:inline">
                      {proposalActions.isConvertingToInvoice
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
          <ProposalPdfPreview
            sequence={sequence}
            proposalNumber={proposal.proposalNumber}
          />
        ) : null}
      </div>

      <SendProposalDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        proposalSequence={sequence!}
        proposalNumber={proposal.proposalNumber}
        clientName={client.name || client.businessName || "Client"}
        clientEmail={proposal.clientEmail}
      />

      <EntityDeleteModal
        isOpen={proposalDelete.isDeleteModalOpen}
        onClose={proposalDelete.closeDeleteModal}
        onConfirm={proposalDelete.handleDeleteConfirm}
        entity="proposal"
        entityName={proposalDelete.proposalToDelete?.proposalNumber || ""}
        isDeleting={proposalDelete.isDeleting}
      />
    </>
  );
}
