"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileCheck,
  DollarSign,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Send,
  Trash2,
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Types
type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
};

type Quote = {
  id: number | string;
  quoteNumber: string;
  clientName?: string;
  total?: number;
  status: string;
  issueDate?: string;
  validUntil?: string;
  companyName?: string;
  companyAddress?: string;
  companyNIT?: string;
  companyEmail?: string;
  companyPhone?: string;
  items?: QuoteItem[];
  notes?: string;
  terms?: string;
  logo?: string | null;
  subtotal?: number;
  totalTax?: number;
  createdAt?: string;
  sentAt?: string;
};

// Status config (used for badge classes/labels)
const statusConfig = {
  sent: {
    label: "Sent",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
  pending: {
    label: "Pending",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
  },
  accepted: {
    label: "Accepted",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/20 text-destructive hover:bg-destructive/30",
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

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = () => {
    const emittedQuotes = JSON.parse(
      localStorage.getItem("emittedQuotes") || "[]"
    );
    const draftQuotes = JSON.parse(
      localStorage.getItem("quoteDrafts") || "[]"
    );

    // Combine both arrays and sort by date (most recent first)
    const allQuotes = [...emittedQuotes, ...draftQuotes].sort((a, b) => {
      const dateA = new Date(
        a.sentAt || a.createdAt || a.issueDate || 0
      ).getTime();
      const dateB = new Date(
        b.sentAt || b.createdAt || b.issueDate || 0
      ).getTime();
      return dateB - dateA;
    });

    setQuotes(allQuotes);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const clientName = quote.clientName || "";
    const quoteAmount = quote.total || 0;

    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quoteAmount.toString().includes(searchQuery);

    // Tab filtering
    let matchesTab = true;
    if (activeTab === "sent") {
      matchesTab = quote.status === "sent";
    } else if (activeTab === "accepted") {
      matchesTab = quote.status === "accepted";
    } else if (activeTab === "pending") {
      matchesTab = quote.status === "pending";
    } else if (activeTab === "drafts") {
      matchesTab = quote.status === "draft";
    }

    // Dropdown filter
    const matchesStatus =
      statusFilter === "all" || quote.status === statusFilter;

    return matchesSearch && matchesTab && matchesStatus;
  });

  const stats = {
    total: quotes.length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    estimatedValue: quotes.reduce((sum, q) => sum + (q.total || 0), 0),
  };

  const handleView = (quoteId: string | number) => {
    // For now, we'll navigate to edit page
    router.push(`/quotes/new`);
    // Store the quote in localStorage for editing
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      localStorage.setItem("editingQuoteDraft", JSON.stringify(quote));
    }
  };

  const handleEdit = (quoteId: string | number) => {
    router.push(`/quotes/new`);
    // Store the quote in localStorage for editing
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      localStorage.setItem("editingQuoteDraft", JSON.stringify(quote));
    }
  };

  const handleDownload = async (quote: Quote) => {
    const previewElement = document.getElementById(
      `quote-preview-${quote.id}`
    );
    if (!previewElement) {
      toast({
        title: "Error",
        description: "Quote preview not found",
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
      const clientName = quote.clientName || "Client";
      const quoteDate = quote.issueDate || "date";
      pdf.save(`Quote-${clientName}-${quoteDate}.pdf`);

      toast({
        title: "PDF downloaded",
        description: `${quote.quoteNumber}.pdf has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (quote: Quote) => {
    // Delete from appropriate localStorage
    if (quote.status === "draft") {
      const drafts = JSON.parse(localStorage.getItem("quoteDrafts") || "[]");
      const updated = drafts.filter((d: Quote) => d.id !== quote.id);
      localStorage.setItem("quoteDrafts", JSON.stringify(updated));
    } else {
      const emitted = JSON.parse(
        localStorage.getItem("emittedQuotes") || "[]"
      );
      const updated = emitted.filter((e: Quote) => e.id !== quote.id);
      localStorage.setItem("emittedQuotes", JSON.stringify(updated));
    }

    loadQuotes();

    toast({
      title: "Quote deleted",
      description: `${quote.quoteNumber} has been deleted.`,
      variant: "destructive",
    });
  };

  const calculateItemTotal = (item: QuoteItem) => {
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
              Quotes
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track all your quotes and estimates
            </p>
          </div>
          <Link href="/quotes/new">
            <Button
              size="lg"
              className="gap-2 w-full sm:w-auto hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
              Create Quote
            </Button>
          </Link>
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
                <FileCheck className="h-4 w-4 text-primary" />
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
                  Sent
                </CardTitle>
                <Send className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.sent}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Accepted
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.accepted}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Estimated Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${(stats.estimatedValue / 1000).toFixed(1)}K
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
                    placeholder="Search quotes..."
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
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
              All Quotes
            </Button>
            <Button
              variant={activeTab === "sent" ? "default" : "outline"}
              onClick={() => setActiveTab("sent")}
              className="whitespace-nowrap"
            >
              Sent
            </Button>
            <Button
              variant={activeTab === "accepted" ? "default" : "outline"}
              onClick={() => setActiveTab("accepted")}
              className="whitespace-nowrap"
            >
              Accepted
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
                {activeTab === "all" && "All Quotes"}
                {activeTab === "sent" && "Sent Quotes"}
                {activeTab === "accepted" && "Accepted Quotes"}
                {activeTab === "pending" && "Pending Quotes"}
                {activeTab === "drafts" && "Draft Quotes"}
                {filteredQuotes.length !== quotes.length &&
                  ` (${filteredQuotes.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No quotes found matching your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuotes.map((quote, index) => {
                    const clientName = quote.clientName || "Unknown Client";
                    const amount = quote.total || 0;
                    const displayDate = quote.issueDate || "N/A";

                    return (
                      <motion.div
                        key={quote.id}
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
                            <FileCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <p className="font-semibold text-foreground text-sm sm:text-base">
                                {quote.quoteNumber}
                              </p>
                              <Badge
                                variant="secondary"
                                className={
                                  statusConfig[
                                    quote.status as keyof typeof statusConfig
                                  ]?.className ||
                                  "bg-muted text-muted-foreground"
                                }
                              >
                                {
                                  statusConfig[
                                    quote.status as keyof typeof statusConfig
                                  ]?.label || quote.status
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
                              Valid until: {quote.validUntil || "N/A"}
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
                                onClick={() => handleView(quote.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(quote.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(quote)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(quote)}
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
      {filteredQuotes.map((quote) => (
        <div
          key={`preview-${quote.id}`}
          id={`quote-preview-${quote.id}`}
          className="fixed -left-[9999px] w-[210mm] bg-white p-8"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                {quote.logo && (
                  <img
                    src={quote.logo || "/placeholder.svg"}
                    alt="Company Logo"
                    className="h-16 mb-4"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900">
                  {quote.companyName || "Company Name"}
                </h1>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {quote.companyAddress || ""}
                </p>
                {quote.companyNIT && (
                  <p className="text-sm text-gray-600">
                    NIT: {quote.companyNIT}
                  </p>
                )}
                {quote.companyEmail && (
                  <p className="text-sm text-gray-600">
                    {quote.companyEmail}
                  </p>
                )}
                {quote.companyPhone && (
                  <p className="text-sm text-gray-600">
                    {quote.companyPhone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">QUOTE</h2>
                <p className="text-sm text-gray-600">
                  #{quote.quoteNumber}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Issue Date: {quote.issueDate}
                </p>
                <p className="text-sm text-gray-600">
                  Valid Until: {quote.validUntil}
                </p>
              </div>
            </div>

            <div className="border-t border-b border-gray-300 py-4">
              <p className="text-sm font-semibold text-gray-900">Quote For:</p>
              <p className="text-sm text-gray-900">{quote.clientName}</p>
            </div>

            {quote.items && quote.items.length > 0 && (
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
                  {quote.items.map((item) => (
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
                    ${(quote.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-semibold text-gray-900">
                    ${(quote.totalTax || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Estimated Total:</span>
                  <span className="text-gray-900">
                    ${(quote.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Notes:</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {quote.notes}
                </p>
              </div>
            )}
            {quote.terms && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900">
                  Terms & Conditions:
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {quote.terms}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </AppLayout>
  );
}

