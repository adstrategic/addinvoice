"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  InvoiceStats,
  InvoiceFilters,
  InvoiceList,
  InvoiceActions,
  useInvoices,
  useInvoiceDelete,
  useInvoiceVoid,
} from "@/features/invoices";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { usePaymentDialog } from "../hooks/usePaymentDialog";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { BusinessSelectionDialog } from "@/components/business-selection-dialog";
import { VoiceInvoicePromptDialog } from "./VoiceInvoicePromptDialog";
import { InvoiceForm } from "../forms/InvoiceForm";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { statusFilterToApiParam } from "../types/api";
import { useInvoiceManager } from "../hooks/useInvoiceFormManager";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { EntityVoidModal } from "@/components/shared/EntityVoidModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useDownloadInvoicePdf } from "../hooks/useDownloadInvoicePDF";
import { VoiceCreateFab } from "@/components/shared/VoiceCreateFab";
import { ArrowLeft } from "lucide-react";
import { useLimitGuard } from "@/hooks/use-limit-guard";

const VALID_STATUSES = [
  "all",
  "paid",
  "overdue",
  "issued",
  "viewed",
  "draft",
] as const;

function parseStatusParam(value: string | null): string {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])
    ? value
    : "all";
}

/**
 * Invoices page component
 * Displays invoice list with server-side search, pagination, stats, and management actions
 */
export default function InvoicesContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const statusFilter = parseStatusParam(searchParams.get("status"));
  const setStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoiceForSend, setSelectedInvoiceForSend] = useState<
    InvoiceResponse | undefined
  >(undefined);
  const paymentDialog = usePaymentDialog();
  // Fetch invoices with pagination, search, and status (server-side)
  const {
    data: invoicesData,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
  } = useInvoices({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const isInitialLoad = isLoading && !invoicesData;
  const isListLoading = isFetching && isPlaceholderData;

  const invoiceManager = useInvoiceManager();
  const invoiceDelete = useInvoiceDelete();
  const invoiceVoid = useInvoiceVoid();
  const downloadPdf = useDownloadInvoicePdf();
  const { guardCreate } = useLimitGuard();

  const handleCreateInvoice = useCallback(() => {
    if (guardCreate("invoices")) return;
    invoiceManager.handleCreateInvoice();
  }, [guardCreate, invoiceManager]);

  const handleCreateInvoiceByVoice = useCallback(() => {
    if (guardCreate("invoices", { viaVoice: true })) return;
    invoiceManager.handleCreateInvoiceByVoice();
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("tour:invoice-voice-clicked"));
    });
  }, [guardCreate, invoiceManager]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        invoiceManager.isFormOpen ? "app:form-open" : "app:form-close",
      ),
    );
  }, [invoiceManager.isFormOpen]);

  const actionParam = searchParams.get("action");
  const didTriggerCreateRef = useRef(false);

  useEffect(() => {
    if (actionParam !== "create") {
      didTriggerCreateRef.current = false;
      return;
    }
    if (invoiceManager.isLoadingBusinesses) return;
    if (didTriggerCreateRef.current) return;
    didTriggerCreateRef.current = true;
    router.replace(pathname);
    handleCreateInvoice();
  }, [
    actionParam,
    invoiceManager.isLoadingBusinesses,
    handleCreateInvoice,
    pathname,
    router,
  ]);

  const handleDownloadPDF = async (invoice: InvoiceResponse) => {
    try {
      await downloadPdf(invoice);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleSendInvoice = (invoice: InvoiceResponse) => {
    setSelectedInvoiceForSend(invoice);
    setSendDialogOpen(true);
  };

  if (isInitialLoad) return <LoadingComponent variant="dashboard" />;

  if (error || !invoicesData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-destructive">
              Error loading invoices. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract invoices and pagination info (already filtered by server)
  const invoices = invoicesData.data;
  const pagination = invoicesData.pagination;

  // If business is selected, show invoice form instead of list
  if (invoiceManager.isFormOpen && invoiceManager.selectedBusiness) {
    return (
      <div>
        <button
          type="button"
          onClick={invoiceManager.close}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </button>
        <InvoiceForm
          selectedBusiness={invoiceManager.selectedBusiness}
          form={invoiceManager.form}
          mode={invoiceManager.mode}
          isLoading={invoiceManager.isMutating}
          isLoadingInvoice={invoiceManager.isLoadingInvoice}
          isLoadingNumber={invoiceManager.isLoadingNextNumber}
          invoiceError={invoiceManager.invoiceError}
          onSubmit={invoiceManager.onSubmit}
          onCancel={invoiceManager.close}
          existingInvoice={invoiceManager.invoice}
          saveBeforeOpenSubform={invoiceManager.saveBeforeOpenSubform}
          draftItems={invoiceManager.draftItems}
          draftTotals={invoiceManager.draftTotals}
          onDraftCreateItem={invoiceManager.addDraftItem}
          onDraftUpdateItem={invoiceManager.updateDraftItem}
          onDraftDeleteItem={invoiceManager.removeDraftItem}
        />
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Invoices
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track all your invoices
            </p>
          </div>
          <InvoiceActions
            onCreateInvoice={handleCreateInvoice}
            onCreateByVoice={handleCreateInvoiceByVoice}
          />
        </div>

        <InvoiceStats stats={invoicesData.stats} />

        <div className="bg-card rounded-2xl border border-border/60 px-4 sm:px-6 pt-5 pb-5 shadow-sm">
          <InvoiceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          <InvoiceList
            invoices={invoices}
            isLoading={isListLoading}
            onDownload={handleDownloadPDF}
            onSend={handleSendInvoice}
            onAddPayment={paymentDialog.openPaymentDialog}
            onDelete={invoiceDelete.openDeleteModal}
            onVoid={invoiceVoid.openVoidModal}
          >
            {pagination && (
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
                emptyMessage="No invoices found"
                itemLabel="invoices"
              />
            )}
          </InvoiceList>
        </div>
      </div>

      {/* Delete Confirmation Modal - Separate logic */}
      <EntityDeleteModal
        isOpen={invoiceDelete.isDeleteModalOpen}
        onClose={invoiceDelete.closeDeleteModal}
        onConfirm={invoiceDelete.handleDeleteConfirm}
        entity="invoice"
        entityName={invoiceDelete.invoiceToDelete?.invoiceNumber || ""}
        isDeleting={invoiceDelete.isDeleting}
      />

      <EntityVoidModal
        isOpen={invoiceVoid.isVoidModalOpen}
        onClose={invoiceVoid.closeVoidModal}
        onConfirm={invoiceVoid.handleVoidConfirm}
        entity="invoice"
        entityName={invoiceVoid.invoiceToVoid?.invoiceNumber || ""}
        isVoiding={invoiceVoid.isVoiding}
      />

      {selectedInvoiceForSend && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            if (!open) {
              setSelectedInvoiceForSend(undefined);
            }
          }}
          invoiceSequence={selectedInvoiceForSend?.sequence}
          invoiceNumber={selectedInvoiceForSend?.invoiceNumber}
          clientName={selectedInvoiceForSend?.client?.name || "Client"}
          clientEmail={selectedInvoiceForSend?.clientEmail}
          publicSlug={selectedInvoiceForSend?.publicSlug}
        />
      )}

      <PaymentFormDialog
        open={paymentDialog.isPaymentDialogOpen}
        onOpenChange={paymentDialog.setIsPaymentDialogOpen}
        invoiceId={paymentDialog.selectedInvoiceForPayment?.id}
        invoiceSequence={paymentDialog.selectedInvoiceForPayment?.sequence}
      />

      <BusinessSelectionDialog
        open={invoiceManager.showBusinessDialog}
        businesses={invoiceManager.businesses}
        onSelect={invoiceManager.handleBusinessSelected}
        onOpenChange={invoiceManager.setShowBusinessDialog}
      />

      <VoiceInvoicePromptDialog
        open={invoiceManager.voicePromptOpen}
        business={invoiceManager.voiceBusiness}
        onOpenChange={(open) => {
          if (!open) {
            invoiceManager.closeVoicePrompt();
          }
        }}
      />

      <VoiceCreateFab
        onClick={handleCreateInvoiceByVoice}
        ariaLabel="Create invoice by voice"
        tourId="invoices-voice-btn"
      />
    </>
  );
}
