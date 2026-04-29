"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { SendAdvanceDialog } from "@/components/send-advance-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Download,
  Edit,
  Send,
  Trash2,
} from "lucide-react";
import { useAdvanceBySequence } from "@/features/advances/hooks/useAdvances";
import { useSendAdvance } from "@/features/advances/hooks/useAdvances";
import { AdvancePdfPreview } from "@/features/advances/components/AdvancePdfPreview";
import { useAdvanceDelete } from "@/features/advances/hooks/useAdvanceDelete";
import { mapStatusToUI } from "@/features/advances";
import { useDownloadAdvancePdf } from "@/features/advances/hooks/useDownloadAdvancePDF";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  invoiced: { label: "Invoiced", className: "bg-primary/20 text-primary" },
};

export default function AdvanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const advanceDelete = useAdvanceDelete({
    onAfterDelete: () => router.push("/advances"),
  });

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading advance...</p>
        </div>
      </div>
    );
  }

  if (error || !advance) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
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
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
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
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>

            {advance.status === "DRAFT" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/advances/${advance.sequence}/edit`}>
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
                  <p>Edit advance</p>
                </TooltipContent>
              </Tooltip>
            ) : null}

            {advance.status === "DRAFT" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() => advanceDelete.openDeleteModal(advance)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete advance</p>
                </TooltipContent>
              </Tooltip>
            ) : null}

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
                <p>Send advance</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {sequence !== null ? (
          <AdvancePdfPreview sequence={sequence} title={advance.projectName} />
        ) : null}
      </div>

      <SendAdvanceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        advanceId={advance.id}
        projectName={advance.projectName}
        clientName={advance.client?.name ?? "Client"}
        clientEmail={advance.client?.email}
        sending={sendAdvance.isPending}
        onSend={({ advanceId, payload }) =>
          sendAdvance.mutateAsync({ advanceId, payload })
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
    </>
  );
}
