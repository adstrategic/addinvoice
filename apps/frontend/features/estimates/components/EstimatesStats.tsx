"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Send, CheckCircle } from "lucide-react";
import type { EstimateListStatsResponse } from "../schemas/estimate.schema";
import { formatCurrency, cn } from "@/lib/utils";
import { ModuleHeroLabel } from "@/components/shared/module-ui";
import { getListCardTheme } from "@/components/shared/list-card-theme";

interface EstimateStatsProps {
  stats: EstimateListStatsResponse;
}

const glassCard =
  "bg-linear-to-br from-card/60 to-card/20 backdrop-blur-2xl border-white/20 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

export function EstimateStats({ stats }: EstimateStatsProps) {
  const theme = getListCardTheme("estimate");

  return (
    <div className="mb-6">
      <div className="mb-5 text-center sm:text-left">
        <ModuleHeroLabel variant="estimate">Estimated Value</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {formatCurrency(stats.estimatedValue)}
        </h2>

        <div className="mt-3 flex items-center gap-4 sm:gap-6 justify-center sm:justify-start">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Accepted
            </p>
            <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.acceptedValue)}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Pending
            </p>
            <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
              {formatCurrency(stats.pendingValue)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <FileCheck className={cn("h-4 w-4", theme.statIcon)} />
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
                Sent
              </CardTitle>
              <div className="p-1.5 bg-blue-500/15 rounded-lg ring-1 ring-blue-500/20">
                <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.sentCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Accepted
              </CardTitle>
              <div className="p-1.5 bg-emerald-500/15 rounded-lg ring-1 ring-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.acceptedCount}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
