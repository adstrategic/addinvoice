"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { DocumentImageViewer } from "@/components/pdf/document-image-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { ApiError } from "@/lib/errors/handler";
import {
  buildPreviewPageUrl,
  type DocumentPreviewMetadata,
} from "@/lib/document-preview";
import { formatCurrency } from "@/lib/utils";
import type { PublicDocumentSummary } from "@addinvoice/schemas";
import {
  useMarkPublicDocumentViewed,
  usePublicDocument,
  usePublicDocumentPreview,
} from "../hooks/usePublicDocument";
import { getPublicDocumentPdfBySlug } from "../service/public-documents.service";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatCurrency(amount);
  }
}

interface PublicDocumentPortalProps {
  slug: string;
}

export function PublicDocumentPortal({ slug }: PublicDocumentPortalProps) {
  const { data: document, isLoading, error } = usePublicDocument(slug);
  const {
    data: preview,
    isPending: isPreviewPending,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
  } = usePublicDocumentPreview(slug);
  const { mutate: markViewedMutate } = useMarkPublicDocumentViewed(slug);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (document) {
      markViewedMutate();
    }
  }, [document, markViewedMutate]);

  const resolvePageSrc = useCallback(
    async (page: number) => {
      if (!preview?.hash) throw new Error("Preview is not ready");
      const base = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/documents/${encodeURIComponent(slug)}/preview`;
      return buildPreviewPageUrl(base, page, preview.hash);
    },
    [preview?.hash, slug],
  );

  const handleDownload = useCallback(async () => {
    if (!document) return;
    setIsDownloading(true);
    try {
      const pdfBytes = await getPublicDocumentPdfBySlug(slug);
      const blob = new Blob([pdfBytes.slice()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      const filename =
        document.type === "invoice"
          ? `invoice-${document.invoiceNumber}.pdf`
          : document.type === "estimate"
            ? `estimate-${document.estimateNumber}.pdf`
            : document.type === "proposal"
              ? `proposal-${document.proposalNumber}.pdf`
              : document.type === "advance"
                ? `advance-${String(document.sequence)}.pdf`
                : "document.pdf";
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [document, slug]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Document not found or is no longer available.";
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white shadow-2xl border-0 rounded-3xl">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-500">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <PublicDocumentLayout
      document={document}
      preview={preview}
      isPreviewPending={isPreviewPending}
      isPreviewError={isPreviewError}
      previewError={previewError instanceof Error ? previewError : null}
      onRetryPreview={() => void refetchPreview()}
      resolvePageSrc={resolvePageSrc}
      onDownload={() => void handleDownload()}
      isDownloading={isDownloading}
    />
  );
}

function PublicDocumentLayout({
  document,
  preview,
  isPreviewPending,
  isPreviewError,
  previewError,
  onRetryPreview,
  resolvePageSrc,
  onDownload,
  isDownloading,
}: {
  document: PublicDocumentSummary;
  preview?: DocumentPreviewMetadata;
  isPreviewPending: boolean;
  isPreviewError: boolean;
  previewError: Error | null;
  onRetryPreview: () => void;
  resolvePageSrc: (page: number) => Promise<string>;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const isInvoice = document.type === "invoice";
  const isEstimate = document.type === "estimate";
  const isProposal = document.type === "proposal";
  const isAdvance = document.type === "advance";

  const isPaid = isInvoice && document.status === "PAID";
  const isAccepted =
    (isEstimate && document.status === "ACCEPTED") ||
    (isProposal && document.status === "ACCEPTED");
  const isInvoiced = isAdvance && document.status === "INVOICED";

  const acceptHref =
    isEstimate && document.signingToken
      ? `/estimate/accept/${document.signingToken}`
      : isProposal && document.signingToken
        ? `/proposal/accept/${document.signingToken}`
        : null;

  const canPay =
    isInvoice && !isPaid && !!document.paymentLink && document.balance > 0;

  const summaryTitle = isInvoice
    ? "Invoice Summary"
    : isEstimate
      ? "Estimate Summary"
      : isProposal
        ? "Proposal Summary"
        : "Work Advance";

  const headline = isAdvance
    ? document.projectName
    : formatMoney(
        document.total,
        isInvoice || isEstimate || isProposal ? document.currency : "USD",
      );

  const metaLine = isAdvance
    ? [
        document.advanceDate,
        document.location,
        `#${String(document.sequence)}`,
      ]
        .filter(Boolean)
        .join(" • ")
    : isInvoice
      ? `${document.invoiceNumber} • Due ${document.dueDate}`
      : isEstimate
        ? document.estimateNumber
        : document.proposalNumber;

  const clientSectionTitle = isAdvance ? "Prepared For" : "Billed To";

  const securityCopy = isAdvance
    ? "This is a secure link powered by ADDINVOICES. Only people with this link can view this work advance."
    : "This is a secure link powered by ADDINVOICES. Your payment details are encrypted and securely processed.";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      <div className="w-full md:w-[400px] bg-white border-b md:border-r border-slate-200 shadow-sm p-6 flex flex-col md:fixed md:h-screen md:left-0 md:top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="font-black text-2xl tracking-tight text-slate-900">
            {document.business.name}
          </div>
          {(isPaid || isAccepted || isInvoiced) && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {isPaid ? "Paid" : isInvoiced ? "Invoiced" : "Accepted"}
            </div>
          )}
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">
              {summaryTitle}
            </p>
            <h1
              className={
                isAdvance
                  ? "text-2xl sm:text-3xl font-black text-slate-900 mb-1 leading-tight"
                  : "text-4xl font-black text-slate-900 mb-1"
              }
            >
              {headline}
            </h1>
            <p className="text-slate-500 text-sm">{metaLine}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">
              {clientSectionTitle}
            </h3>
            <p className="font-semibold text-slate-900 wrap-break-word">
              {document.client.name}
            </p>
            {document.client.email && (
              <p className="text-slate-500 text-sm wrap-break-word mt-1">
                {document.client.email}
              </p>
            )}
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
            <p className="text-xs leading-relaxed font-medium">{securityCopy}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
          {canPay && (
            <Button
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
              size="lg"
              asChild
            >
              <a
                href={document.paymentLink!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay {formatMoney(document.balance, document.currency ?? "USD")}
                <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
              </a>
            </Button>
          )}

          {acceptHref && !isAccepted && (
            <Button
              className="w-full h-14 text-base font-bold rounded-xl"
              size="lg"
              asChild
            >
              <Link href={acceptHref}>
                {isEstimate ? "Accept Estimate" : "Accept Proposal"}
              </Link>
            </Button>
          )}

          {isPaid && (
            <Button
              className="w-full h-14 text-base font-bold rounded-xl"
              disabled
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Payment Complete
            </Button>
          )}

          {isAccepted && (
            <Button
              className="w-full h-14 text-base font-bold rounded-xl"
              disabled
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Document Accepted
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-slate-600 bg-white"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <div className="flex-1 md:ml-[400px] p-4 sm:p-10 lg:p-20 bg-slate-100/50 flex justify-center items-start min-h-screen">
        <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden relative min-h-[60vh]">
          <DocumentImageViewer
            pages={preview?.pages}
            resolvePageSrc={resolvePageSrc}
            isLoading={isPreviewPending}
            isError={isPreviewError || !preview}
            error={previewError}
            onRetry={onRetryPreview}
            containerClassName="min-h-[70vh] overflow-auto p-4 sm:p-8 flex flex-col items-center gap-4"
          />
        </div>
      </div>
    </div>
  );
}
