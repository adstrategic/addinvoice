"use client";

import { useState } from "react";
import {
  InvoiceStats,
  InvoiceFilters,
  InvoiceList,
  InvoiceActions,
  useInvoices,
  useInvoiceDelete,
  useMarkInvoiceAsPaid,
} from "@/features/invoices";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { motion } from "framer-motion";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { InvoicePDFPreview } from "./InvoicePDFPreview";
import { BusinessSelectionDialog } from "@/components/business-selection-dialog";
import { InvoiceForm } from "../forms/InvoiceForm";
import type { InvoiceResponse } from "../types/api";
import { mapStatusToUI } from "../types/api";
import { useInvoiceManager } from "../hooks/useInvoiceFormManager";
import { AppLayout } from "@/components/app-layout";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * Invoices page component
 * Displays invoice list with server-side search, pagination, stats, and management actions
 */
export default function InvoicesContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoiceForSend, setSelectedInvoiceForSend] =
    useState<InvoiceResponse | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  // Fetch invoices with pagination and search
  // Note: Status and tab filtering are done client-side to match original behavior
  const {
    data: invoicesData,
    isFetching,
    error,
  } = useInvoices({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const invoiceManager = useInvoiceManager();
  const invoiceDelete = useInvoiceDelete();
  const markAsPaidMutation = useMarkInvoiceAsPaid();

  const handleMarkAsPaid = async (invoice: InvoiceResponse) => {
    await markAsPaidMutation.mutateAsync(invoice.id);
  };

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

  // Extract invoices and pagination info
  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Filter invoices by tab and status (client-side filtering)
  const filteredInvoices = invoices.filter((invoice) => {
    const uiStatus = mapStatusToUI(invoice.status);
    const clientName =
      invoice.client?.name || invoice.client?.businessName || "";
    const invoiceAmount = invoice.total || 0;

    // Search filtering (if search is done client-side)
    const matchesSearch =
      !debouncedSearch ||
      invoice.invoiceNumber
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoiceAmount.toString().includes(debouncedSearch);

    // Status filter dropdown
    const matchesStatus = statusFilter === "all" || uiStatus === statusFilter;

    // Tab filtering
    let matchesTab = true;
    if (activeTab === "emitted") {
      matchesTab =
        uiStatus === "issued" || uiStatus === "pending" || uiStatus === "paid";
    } else if (activeTab === "paid") {
      matchesTab = uiStatus === "paid";
    } else if (activeTab === "pending") {
      matchesTab = uiStatus === "pending";
    } else if (activeTab === "drafts") {
      matchesTab = uiStatus === "draft";
    }

    return matchesSearch && matchesStatus && matchesTab;
  });

  if (error) {
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

  if (isFetching) {
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

  // If business is selected, show invoice form instead of list
  if (invoiceManager.isFormOpen && invoiceManager.selectedBusiness) {
    return (
      <>
        <InvoiceForm
          selectedBusiness={invoiceManager.selectedBusiness}
          form={invoiceManager.form}
          mode={invoiceManager.mode}
          isLoading={invoiceManager.isMutating}
          isLoadingInvoice={invoiceManager.isLoadingInvoice}
          invoiceError={invoiceManager.invoiceError}
          onSubmit={invoiceManager.onSubmit}
          onCancel={invoiceManager.close}
          existingInvoice={invoiceManager.invoice}
          ensureInvoiceExists={invoiceManager.ensureInvoiceExists}
        />
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

        {!invoices ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          <>
            <InvoiceStats invoices={invoices} />

            <InvoiceFilters
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Invoices List */}
            <InvoiceList
              invoices={filteredInvoices}
              activeTab={activeTab}
              onEdit={(sequence) => router.push(`/invoices/${sequence}/edit`)}
              onView={(sequence) => router.push(`/invoices/${sequence}`)}
              onDownload={handleDownloadPDF}
              onSend={handleSendInvoice}
              onMarkAsPaid={handleMarkAsPaid}
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
          </>
        )}
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

      {/* Hidden PDF previews for PDF generation */}
      {invoices.map((invoice) => (
        <InvoicePDFPreview key={invoice.id} invoice={invoice} />
      ))}

      {selectedInvoiceForSend && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            if (!open) {
              setSelectedInvoiceForSend(null);
            }
          }}
          invoiceSequence={selectedInvoiceForSend.sequence}
          invoiceNumber={selectedInvoiceForSend.invoiceNumber}
          clientName={
            selectedInvoiceForSend.client?.name ||
            selectedInvoiceForSend.client?.businessName ||
            "Client"
          }
          clientEmail={selectedInvoiceForSend.client?.email}
        />
      )}

      <BusinessSelectionDialog
        open={invoiceManager.showBusinessDialog}
        businesses={invoiceManager.businesses}
        onSelect={invoiceManager.selectBusiness}
        onOpenChange={invoiceManager.setShowBusinessDialog}
      />
    </>
  );
}
