"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Send,
  Trash2,
  Mic,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Types
type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
};

type Invoice = {
  id: number | string;
  invoiceNumber: string;
  client?: string;
  clientName?: string;
  amount?: number;
  total?: number;
  status: string;
  date?: string;
  issueDate?: string;
  dueDate: string;
  companyName?: string;
  companyAddress?: string;
  companyNIT?: string;
  companyEmail?: string;
  companyPhone?: string;
  items?: InvoiceItem[];
  notes?: string;
  terms?: string;
  logo?: string | null;
  subtotal?: number;
  totalTax?: number;
  createdAt?: string;
  emittedAt?: string;
};

// Status config (used for badge classes/labels)
const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  pending: {
    label: "Pending",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
  },
  issued: {
    label: "Issued",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
};

// Tipado correcto para variantes de Framer Motion
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    client: string;
  } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );

    // Combine both arrays and sort by date (most recent first)
    const allInvoices = [...emittedInvoices, ...draftInvoices].sort((a, b) => {
      const dateA = new Date(
        a.emittedAt || a.createdAt || a.issueDate || a.date || 0
      ).getTime();
      const dateB = new Date(
        b.emittedAt || b.createdAt || b.issueDate || b.date || 0
      ).getTime();
      return dateB - dateA;
    });

    setInvoices(allInvoices);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const clientName = invoice.client || invoice.clientName || "";
    const invoiceAmount = invoice.amount || invoice.total || 0;

    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceAmount.toString().includes(searchQuery);

    // Tab filtering
    let matchesTab = true;
    if (activeTab === "emitted") {
      matchesTab =
        invoice.status === "issued" ||
        invoice.status === "pending" ||
        invoice.status === "paid";
    } else if (activeTab === "paid") {
      matchesTab = invoice.status === "paid";
    } else if (activeTab === "pending") {
      matchesTab = invoice.status === "pending";
    } else if (activeTab === "drafts") {
      matchesTab = invoice.status === "draft";
    }

    // Dropdown filter
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesTab && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
    pending: invoices.filter((inv) => inv.status === "pending").length,
    revenue: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.amount || inv.total || 0), 0),
  };

  const handleView = (invoiceId: string | number) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleEdit = (invoiceId: string | number) => {
    router.push(`/invoices/${invoiceId}/edit`);
  };

  const handleSend = (invoice: {
    id: string | number;
    client?: string;
    clientName?: string;
  }) => {
    setSelectedInvoice({
      id: invoice.id.toString(),
      client: invoice.client || invoice.clientName || "Unknown Client",
    });
    setSendDialogOpen(true);
  };

  const handleDownload = async (invoice: Invoice) => {
    const previewElement = document.getElementById(
      `invoice-preview-${invoice.id}`
    );
    if (!previewElement) {
      toast({
        title: "Error",
        description: "Invoice preview not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const clientName = invoice.client || invoice.clientName || "Client";
      const invoiceDate = invoice.date || invoice.issueDate || "date";
      pdf.save(`Invoice-${clientName}-${invoiceDate}.pdf`);

      toast({
        title: "PDF downloaded",
        description: `${invoice.invoiceNumber}.pdf has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (invoice: Invoice) => {
    // Delete from appropriate localStorage
    if (invoice.status === "draft") {
      const drafts = JSON.parse(localStorage.getItem("invoiceDrafts") || "[]");
      const updated = drafts.filter((d: Invoice) => d.id !== invoice.id);
      localStorage.setItem("invoiceDrafts", JSON.stringify(updated));
    } else {
      const emitted = JSON.parse(
        localStorage.getItem("emittedInvoices") || "[]"
      );
      const updated = emitted.filter((e: Invoice) => e.id !== invoice.id);
      localStorage.setItem("emittedInvoices", JSON.stringify(updated));
    }

    loadInvoices();

    toast({
      title: "Invoice deleted",
      description: `${invoice.invoiceNumber} has been deleted.`,
      variant: "destructive",
    });
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.tax) / 100;
    return subtotal + taxAmount;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/invoices/voice" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-transparent"
              >
                <Mic className="h-5 w-5" />
                Create by Voice
              </Button>
            </Link>
            <Link href="/invoices/new" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                <Plus className="h-5 w-5" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </motion.div>
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Paid
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.paid}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <Calendar className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${(stats.revenue / 1000).toFixed(1)}K
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="mb-4 sm:mb-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              className="whitespace-nowrap"
            >
              All Invoices
            </Button>
            <Button
              variant={activeTab === "emitted" ? "default" : "outline"}
              onClick={() => setActiveTab("emitted")}
              className="whitespace-nowrap"
            >
              Emitted
            </Button>
            <Button
              variant={activeTab === "paid" ? "default" : "outline"}
              onClick={() => setActiveTab("paid")}
              className="whitespace-nowrap"
            >
              Paid
            </Button>
            <Button
              variant={activeTab === "pending" ? "default" : "outline"}
              onClick={() => setActiveTab("pending")}
              className="whitespace-nowrap"
            >
              Pending
            </Button>
            <Button
              variant={activeTab === "drafts" ? "default" : "outline"}
              onClick={() => setActiveTab("drafts")}
              className="whitespace-nowrap"
            >
              Drafts
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                {activeTab === "all" && "All Invoices"}
                {activeTab === "emitted" && "Emitted Invoices"}
                {activeTab === "paid" && "Paid Invoices"}
                {activeTab === "pending" && "Pending Invoices"}
                {activeTab === "drafts" && "Draft Invoices"}
                {filteredInvoices.length !== invoices.length &&
                  ` (${filteredInvoices.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No invoices found matching your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice, index) => {
                    const clientName =
                      invoice.client || invoice.clientName || "Unknown Client";
                    const amount = invoice.amount || invoice.total || 0;
                    const displayDate =
                      invoice.date || invoice.issueDate || "N/A";

                    return (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.5 + index * 0.05,
                        }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <p className="font-semibold text-foreground text-sm sm:text-base">
                                {invoice.invoiceNumber}
                              </p>
                              <Badge
                                variant="secondary"
                                className={
                                  statusConfig[
                                    invoice.status as keyof typeof statusConfig
                                  ].className
                                }
                              >
                                {
                                  statusConfig[
                                    invoice.status as keyof typeof statusConfig
                                  ].label
                                }
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {clientName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-foreground text-sm sm:text-base">
                              ${amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Due: {invoice.dueDate}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(invoice.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(invoice.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(invoice)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSend(invoice)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(invoice)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hidden previews for PDF generation */}
      {filteredInvoices.map((invoice) => (
        <div
          key={`preview-${invoice.id}`}
          id={`invoice-preview-${invoice.id}`}
          className="fixed -left-[9999px] w-[210mm] bg-white p-8"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                {invoice.logo && (
                  <img
                    src={invoice.logo || "/placeholder.svg"}
                    alt="Company Logo"
                    className="h-16 mb-4"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900">
                  {invoice.companyName || "Company Name"}
                </h1>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {invoice.companyAddress || ""}
                </p>
                {invoice.companyNIT && (
                  <p className="text-sm text-gray-600">
                    NIT: {invoice.companyNIT}
                  </p>
                )}
                {invoice.companyEmail && (
                  <p className="text-sm text-gray-600">
                    {invoice.companyEmail}
                  </p>
                )}
                {invoice.companyPhone && (
                  <p className="text-sm text-gray-600">
                    {invoice.companyPhone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-sm text-gray-600">
                  #{invoice.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Issue Date: {invoice.date || invoice.issueDate}
                </p>
                <p className="text-sm text-gray-600">
                  Due Date: {invoice.dueDate}
                </p>
              </div>
            </div>

            <div className="border-t border-b border-gray-300 py-4">
              <p className="text-sm font-semibold text-gray-900">Bill To:</p>
              <p className="text-sm text-gray-900">
                {invoice.client || invoice.clientName}
              </p>
            </div>

            {invoice.items && invoice.items.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-900">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-900">
                      Tax
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-2 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="text-right py-2 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="text-right py-2 text-sm text-gray-900">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="text-right py-2 text-sm text-gray-900">
                        {item.tax}%
                      </td>
                      <td className="text-right py-2 text-sm text-gray-900">
                        ${calculateItemTotal(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ${(invoice.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-semibold text-gray-900">
                    ${(invoice.totalTax || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    ${(invoice.total || invoice.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Notes:</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900">
                  Terms & Conditions:
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {selectedInvoice && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceId={selectedInvoice.id}
          clientName={selectedInvoice.client}
        />
      )}
    </AppLayout>
  );
}
