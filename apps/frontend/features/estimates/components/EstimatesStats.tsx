"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Calendar } from "lucide-react";
import { motion, type Variants } from "framer-motion";
// TODO: add Stats
import type { EstimateListStatsResponse } from "../schemas/estimate.schema";
import { formatCurrency } from "@/lib/utils";

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
 * Estimate statistics cards component
 * Displays total estimates, paid, overdue, and revenue (from API aggregates)
 */
export function EstimateStats({ stats }: { stats: EstimateListStatsResponse }) {
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
    </motion.div>
  );
}
