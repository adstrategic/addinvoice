"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  DollarSign,
  Calendar,
  MoreVertical,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
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
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ReceivePaymentDialog } from "@/components/receive-payment-dialog";

// Types
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
  paidAmount?: number;
  paymentStatus?: "paid" | "pending" | "overdue" | "partially_paid";
  emittedAt?: string;
  createdAt?: string;
};

// Status config
const paymentStatusConfig = {
  paid: {
    label: "Paid",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/20 text-destructive hover:bg-destructive/30",
    icon: AlertCircle,
  },
  partially_paid: {
    label: "Partially Paid",
    className: "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30",
    icon: DollarSign,
  },
};

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

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [receivePaymentDialogOpen, setReceivePaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const loAddInvoices = useCallback(() => {
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );

    // Combine and calculate payment status
    const allInvoices = [...emittedInvoices, ...draftInvoices].map(
      (invoice: Invoice) => {
        let paymentStatus: "paid" | "pending" | "overdue" | "partially_paid" =
          "pending";

        if (invoice.status === "paid") {
          paymentStatus = "paid";
        } else if (invoice.paymentStatus === "overdue") {
          paymentStatus = "overdue";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(invoice.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today && invoice.status !== "paid") {
            paymentStatus = "overdue";
          } else if (invoice.paidAmount && invoice.paidAmount > 0) {
            const total = invoice.amount || invoice.total || 0;
            if (invoice.paidAmount < total) {
              paymentStatus = "partially_paid";
            } else {
              paymentStatus = "paid";
            }
          }
        }

        return {
          ...invoice,
          paymentStatus,
          paidAmount: invoice.paidAmount || 0,
        };
      }
    );

    // Sort by date (most recent first)
    allInvoices.sort((a, b) => {
      const dateA = new Date(
        a.emittedAt || a.createdAt || a.issueDate || a.date || 0
      ).getTime();
      const dateB = new Date(
        b.emittedAt || b.createdAt || b.issueDate || b.date || 0
      ).getTime();
      return dateB - dateA;
    });

    setInvoices(allInvoices);
  }, []);

  const checkOverdueInvoices = useCallback(() => {
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );
    const allInvoices = [...emittedInvoices, ...draftInvoices];
    
    let updated = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedInvoices: Invoice[] = allInvoices.map((invoice: Invoice) => {
      if (
        (invoice.status === "pending" || invoice.status === "issued") &&
        invoice.paymentStatus !== "paid" &&
        invoice.paymentStatus !== "partially_paid"
      ) {
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          updated = true;
          return { ...invoice, paymentStatus: "overdue", status: "overdue" };
        }
      }
      return invoice;
    });

    if (updated) {
      // Separate back into emitted and drafts
      const updatedEmitted = updatedInvoices.filter(
        (inv: Invoice) => inv.status !== "draft"
      );
      const updatedDrafts = updatedInvoices.filter(
        (inv: Invoice) => inv.status === "draft"
      );
      
      localStorage.setItem("emittedInvoices", JSON.stringify(updatedEmitted));
      localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts));
      
      loAddInvoices();
    }
  }, [loAddInvoices]);

  useEffect(() => {
    loAddInvoices();
    checkOverdueInvoices();
    // Check for overdue invoices daily
    const interval = setInterval(checkOverdueInvoices, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loAddInvoices, checkOverdueInvoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const clientName = invoice.client || invoice.clientName || "";
    const invoiceAmount = invoice.amount || invoice.total || 0;

    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceAmount.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || invoice.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((inv) => inv.paymentStatus === "paid").length,
    pending: invoices.filter((inv) => inv.paymentStatus === "pending").length,
    overdue: invoices.filter((inv) => inv.paymentStatus === "overdue").length,
    partiallyPaid: invoices.filter(
      (inv) => inv.paymentStatus === "partially_paid"
    ).length,
    totalRevenue: invoices
      .filter((inv) => inv.paymentStatus === "paid")
      .reduce((sum, inv) => sum + (inv.amount || inv.total || 0), 0),
    pendingAmount: invoices
      .filter((inv) => inv.paymentStatus === "pending" || inv.paymentStatus === "overdue")
      .reduce((sum, inv) => {
        const total = inv.amount || inv.total || 0;
        const paid = inv.paidAmount || 0;
        return sum + (total - paid);
      }, 0),
  };

  const handleReceivePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReceivePaymentDialogOpen(true);
  };

  const handleView = (invoiceId: string | number) => {
    router.push(`/invoices/${invoiceId}`);
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
              Payments
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track and manage invoice payments
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/payments/methods">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-transparent"
              >
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 sm:mb-8"
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
                <DollarSign className="h-4 w-4 text-primary" />
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
                <CheckCircle2 className="h-4 w-4 text-primary" />
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
                <Clock className="h-4 w-4 text-chart-4" />
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
                  Overdue
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.overdue}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Partially Paid
                </CardTitle>
                <DollarSign className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.partiallyPaid}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Pending Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${(stats.pendingAmount / 1000).toFixed(1)}K
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
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
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
        >
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                Invoices ({filteredInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                    const paidAmount = invoice.paidAmount || 0;
                    const remaining = amount - paidAmount;
                    const StatusIcon =
                      paymentStatusConfig[
                        invoice.paymentStatus as keyof typeof paymentStatusConfig
                      ]?.icon || Clock;

                    return (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.5 + index * 0.05,
                        }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <StatusIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <p className="font-semibold text-foreground text-sm sm:text-base">
                                {invoice.invoiceNumber}
                              </p>
                              <Badge
                                variant="secondary"
                                className={
                                  paymentStatusConfig[
                                    invoice.paymentStatus as keyof typeof paymentStatusConfig
                                  ]?.className || ""
                                }
                              >
                                {
                                  paymentStatusConfig[
                                    invoice.paymentStatus as keyof typeof paymentStatusConfig
                                  ]?.label || "Pending"
                                }
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {clientName}
                            </p>
                            {paidAmount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Paid: ${paidAmount.toLocaleString()} / Total: $
                                {amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-foreground text-sm sm:text-base">
                              ${amount.toLocaleString()}
                            </p>
                            {remaining > 0 && remaining < amount && (
                              <p className="text-xs text-destructive">
                                Remaining: ${remaining.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Due: {invoice.dueDate}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
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
                              {invoice.paymentStatus !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => handleReceivePayment(invoice)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Receive Payment
                                </DropdownMenuItem>
                              )}
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

      {selectedInvoice && (
        <ReceivePaymentDialog
          open={receivePaymentDialogOpen}
          onOpenChange={setReceivePaymentDialogOpen}
          invoice={selectedInvoice}
          onPaymentReceived={loAddInvoices}
        />
      )}
    </AppLayout>
  );
}

