"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Calendar } from "lucide-react";
import type { z } from "zod";
import type { invoiceListStatsSchema } from "../schemas/invoice.schema";
import { formatCurrency, cn } from "@/lib/utils";
import { ModuleHeroLabel } from "@/components/shared/module-ui";
import { getListCardTheme } from "@/components/shared/list-card-theme";

type InvoiceListStats = z.infer<typeof invoiceListStatsSchema>;

interface InvoiceStatsProps {
  stats: InvoiceListStats;
}

const glassCard =
  "bg-linear-to-br from-card/60 to-card/20 backdrop-blur-2xl border-white/20 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

export function InvoiceStats({ stats }: InvoiceStatsProps) {
  const theme = getListCardTheme("invoice");

  return (
    <div className="mb-6">
      {/* Revenue hero */}
      <div className="mb-5 text-center sm:text-left">
        <ModuleHeroLabel variant="invoice">Total Revenue</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {formatCurrency(stats.revenue)}
        </h2>

        <div className="mt-3 flex items-center gap-4 sm:gap-6 justify-center sm:justify-start">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Invoiced
            </p>
            <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.totalInvoiced)}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Outstanding
            </p>
            <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.outstanding)}
            </p>
          </div>
        </div>
      </div>

      {/* 3 glassmorphism stat cards — horizontal scroll on mobile, 3-col grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <FileText className={cn("h-4 w-4", theme.statIcon)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.total}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Paid
              </CardTitle>
              <div className="p-1.5 bg-emerald-500/15 rounded-lg ring-1 ring-emerald-500/20">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.paidCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Overdue
              </CardTitle>
              <div className="p-1.5 bg-amber-500/15 rounded-lg ring-1 ring-amber-500/20">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.pendingCount}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
