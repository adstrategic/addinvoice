"use client";

import { useState } from "react";
import {
  InvoiceStats,
  InvoiceFilters,
  InvoiceList,
  InvoiceActions,
  useInvoices,
  useInvoiceDelete,
} from "@/features/invoices";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { usePaymentDialog } from "../hooks/usePaymentDialog";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { motion } from "framer-motion";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { BusinessSelectionDialog } from "@/components/business-selection-dialog";
import { InvoiceForm } from "../forms/InvoiceForm";
import type { InvoiceResponse } from "../schemas/invoice.schema";
import { statusFilterToApiParam } from "../types/api";
import { useInvoiceManager } from "../hooks/useInvoiceFormManager";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const VALID_STATUSES = ["all", "paid", "overdue", "issued", "draft"] as const;

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
    router.push(`${pathname}?${params.toString()}`);
  };

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoiceForSend, setSelectedInvoiceForSend] = useState<
    InvoiceResponse | undefined
  >(undefined);
  const paymentDialog = usePaymentDialog();
  const { toast } = useToast();
  // Fetch invoices with pagination, search, and status (server-side)
  const {
    data: invoicesData,
    isLoading,
    error,
  } = useInvoices({
    page: currentPage,
    search: debouncedSearch || undefined,
    status: statusFilterToApiParam(statusFilter),
  });

  const invoiceManager = useInvoiceManager();
  const invoiceDelete = useInvoiceDelete();

  const handleDownloadPDF = async (invoice: InvoiceResponse) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.sequence}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "PDF downloaded",
        description: "The invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = (invoice: InvoiceResponse) => {
    setSelectedInvoiceForSend(invoice);
    setSendDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoicesData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading invoices. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract invoices and pagination info (already filtered by server)
  const invoices = invoicesData.data;
  const pagination = invoicesData.pagination;

  // If business is selected, show invoice form instead of list
  if (invoiceManager.isFormOpen && invoiceManager.selectedBusiness) {
    return (
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
        ensureInvoiceExists={invoiceManager.ensureInvoiceExists}
      />
    );
  }

  return (
    <>
      <div className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Invoices
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track all your invoices
            </p>
          </div>
          <InvoiceActions
            onCreateInvoice={invoiceManager.handleCreateInvoice}
          />
        </motion.div>

        <InvoiceStats stats={invoicesData.stats} />

        <InvoiceFilters
          searchTerm={searchTerm}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Invoices List */}
        <InvoiceList
          invoices={invoices}
          statusFilter={statusFilter}
          onEdit={(sequence) => router.push(`/invoices/${sequence}/edit`)}
          onView={(sequence) => router.push(`/invoices/${sequence}`)}
          onDownload={handleDownloadPDF}
          onSend={handleSendInvoice}
          onAddPayment={paymentDialog.openPaymentDialog}
          onDelete={invoiceDelete.openDeleteModal}
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

      {/* Delete Confirmation Modal - Separate logic */}
      <EntityDeleteModal
        isOpen={invoiceDelete.isDeleteModalOpen}
        onClose={invoiceDelete.closeDeleteModal}
        onConfirm={invoiceDelete.handleDeleteConfirm}
        entity="invoice"
        entityName={invoiceDelete.invoiceToDelete?.invoiceNumber || ""}
        isDeleting={invoiceDelete.isDeleting}
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
        onSelect={invoiceManager.selectBusiness}
        onOpenChange={invoiceManager.setShowBusinessDialog}
      />
    </>
  );
}
