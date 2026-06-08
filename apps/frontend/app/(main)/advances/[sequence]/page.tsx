"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DocumentStatusBadge } from "@/components/shared/DocumentStatusBadge";
import { Button } from "@/components/ui/button";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { SendAdvanceDialog } from "@/components/send-advance-dialog";
import {
  ArrowLeft,
  Download,
  Edit,
  Send,
  Trash2,
  Ban,
} from "lucide-react";
import { useAdvanceBySequence } from "@/features/advances/hooks/useAdvances";
import { useSendAdvance } from "@/features/advances/hooks/useAdvances";
import { AdvancePdfPreview } from "@/features/advances/components/AdvancePdfPreview";
import { useAdvanceDelete } from "@/features/advances/hooks/useAdvanceDelete";
import { useAdvanceVoid } from "@/features/advances/hooks/useAdvanceVoid";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { canVoidAdvance } from "@/lib/document-void";
import { canSendAdvance } from "@/lib/is-document-public-issued";
import { mapStatusToUI } from "@/features/advances";
import { useDownloadAdvancePdf } from "@/features/advances/hooks/useDownloadAdvancePDF";
import { DetailPageLoading } from "@/components/loading-component";

export default function AdvanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const advanceDelete = useAdvanceDelete({
    onAfterDelete: () => router.push("/advances"),
  });
  const advanceVoid = useAdvanceVoid();

  const sequence = params?.sequence
    ? Number.parseInt(params.sequence as string, 10)
    : null;
  const {
    data: advance,
    isLoading,
    error,
  } = useAdvanceBySequence(sequence, sequence !== null);
  const downloadPdf = useDownloadAdvancePdf();
  const sendAdvance = useSendAdvance();

  if (isLoading) return <DetailPageLoading />

  if (error || !advance) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Advance not found</p>
        </div>
      </div>
    );
  }

  const uiStatus = mapStatusToUI(advance.status);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadPdf(advance);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/advances" className="shrink-0">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">
                  {advance.projectName}
                </h1>
                <DocumentStatusBadge
                  uiStatus={uiStatus}
                  documentType="advance"
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
              <Download className="h-4 w-4 shrink-0" />
              Download PDF
            </Button>

            {advance.status === "DRAFT" && (
              <Link href={`/advances/${advance.sequence}/edit`}>
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

            {advance.status === "DRAFT" && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
                onClick={() => advanceDelete.openDeleteModal(advance)}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete
              </Button>
            )}

            {canSendAdvance(advance) && (
              <Button
                size="lg"
                className="gap-2 shrink-0"
                onClick={() => setSendDialogOpen(true)}
              >
                <Send className="h-4 w-4 shrink-0" />
                Send
              </Button>
            )}

            {canVoidAdvance(advance) && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shrink-0 bg-transparent text-destructive hover:text-destructive"
                onClick={() => advanceVoid.openVoidModal(advance)}
              >
                <Ban className="h-4 w-4 shrink-0" />
                Mark as voided
              </Button>
            )}
          </div>
        </div>

        {sequence !== null ? (
          <AdvancePdfPreview sequence={sequence} title={advance.projectName} />
        ) : null}
      </div>

      <SendAdvanceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        advanceSequence={advance.sequence}
        projectName={advance.projectName}
        clientName={advance.client?.name ?? "Client"}
        clientEmail={advance.client?.email}
        publicSlug={advance.publicSlug}
        sending={sendAdvance.isPending}
        onSend={({ sequence, payload }) =>
          sendAdvance.mutateAsync({ sequence, payload })
        }
      />

      <EntityDeleteModal
        isOpen={advanceDelete.isDeleteModalOpen}
        onClose={advanceDelete.closeDeleteModal}
        onConfirm={advanceDelete.handleDeleteConfirm}
        entity="advance"
        entityName={advanceDelete.advanceToDelete?.label || ""}
        isDeleting={advanceDelete.isDeleting}
      />

      <EntityVoidModal
        isOpen={advanceVoid.isVoidModalOpen}
        onClose={advanceVoid.closeVoidModal}
        onConfirm={advanceVoid.handleVoidConfirm}
        entity="advance"
        entityName={advanceVoid.advanceToVoid?.label || ""}
        isVoiding={advanceVoid.isVoiding}
      />
    </>
  );
}
