"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Calendar } from "lucide-react";
import { motion, Variants } from "framer-motion";
import type { z } from "zod";
import type { invoiceListStatsSchema } from "../schemas/invoice.schema";
import { formatCurrency } from "@/lib/utils";

type InvoiceListStats = z.infer<typeof invoiceListStatsSchema>;

interface InvoiceStatsProps {
  stats: InvoiceListStats;
}

// Framer Motion variants
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

/**
 * Invoice statistics cards component
 * Displays total invoices, paid, overdue, and revenue (from API aggregates)
 */
export function InvoiceStats({ stats }: InvoiceStatsProps) {
  return (
    <motion.div
      className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
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
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
              Paid
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {stats.paidCount}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <Calendar className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {formatCurrency(stats.revenue)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Invoiced: {formatCurrency(stats.totalInvoiced)}
              <br />
              Outstanding: {formatCurrency(stats.outstanding)}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
