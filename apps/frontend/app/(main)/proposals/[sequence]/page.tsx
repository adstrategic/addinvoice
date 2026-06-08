"use client";

import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/shared/DocumentStatusBadge";
import {
  ArrowLeft,
  Download,
  Send,
  Ban,
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
  useProposalVoid,
  useProposalActions,
  useMarkProposalAsAccepted,
  mapStatusToUI,
} from "@/features/proposals";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { canVoidProposal } from "@/lib/document-void";
import { canSendProposalFromDetail } from "@/lib/is-document-public-issued";
import { toast } from "sonner";
import { useDownloadProposalPdf } from "@/features/proposals/hooks/useDownloadProposalPDF";
import { DetailPageLoading } from "@/components/loading-component";

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

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const proposalVoid = useProposalVoid();
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

  if (isLoading) return <DetailPageLoading />

  if (error || !proposal) {
    return (
      <div className="max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto">
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
                <DocumentStatusBadge
                  uiStatus={uiStatus}
                  documentType="proposal"
                  size="md"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">PDF preview</p>
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
              {downloading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Download className="h-4 w-4 shrink-0" />
              )}
              Download PDF
            </Button>

            {canSendProposalFromDetail(proposal.status) && (
              <Button
                size="lg"
                className="gap-2 shrink-0"
                onClick={() => setSendDialogOpen(true)}
                disabled={proposalActions.isSending}
              >
                <Send className="h-4 w-4 shrink-0" />
                {proposal.status === "REJECTED" ? "Resend" : "Send"}
              </Button>
            )}

            {proposal.status === "SENT" && (
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shrink-0"
                onClick={() => markAsAccepted.mutate(proposal.id)}
                disabled={markAsAccepted.isPending}
              >
                {markAsAccepted.isPending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                )}
                {markAsAccepted.isPending ? "Accepting…" : "Mark as accepted"}
              </Button>
            )}

            {proposal.status === "ACCEPTED" && (
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shrink-0"
                onClick={() => proposalActions.handleConvertToInvoice(proposal)}
                disabled={proposalActions.isConvertingToInvoice}
              >
                {proposalActions.isConvertingToInvoice ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4 shrink-0" />
                )}
                {proposalActions.isConvertingToInvoice
                  ? "Converting…"
                  : "Convert to Invoice"}
              </Button>
            )}

            {canVoidProposal(proposal) && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
                onClick={() => proposalVoid.openVoidModal(proposal)}
              >
                <Ban className="h-4 w-4 shrink-0" />
                Mark as voided
              </Button>
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
        publicSlug={proposal.publicSlug}
        enableEmailTab={proposal.status === "REJECTED"}
      />

      <EntityVoidModal
        isOpen={proposalVoid.isVoidModalOpen}
        onClose={proposalVoid.closeVoidModal}
        onConfirm={proposalVoid.handleVoidConfirm}
        entity="proposal"
        entityName={proposalVoid.proposalToVoid?.proposalNumber || ""}
        isVoiding={proposalVoid.isVoiding}
      />
    </>
  );
}
