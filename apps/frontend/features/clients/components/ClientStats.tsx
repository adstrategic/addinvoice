"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, UserPlus } from "lucide-react";
import type { ClientListStats } from "@addinvoice/schemas";
import { ModuleHeroLabel } from "@/components/shared/module-ui";
import { getListCardTheme } from "@/components/shared/list-card-theme";
import { cn } from "@/lib/utils";

interface ClientStatsProps {
  stats: ClientListStats;
}

const glassCard =
  "bg-linear-to-br from-card/60 to-card/20 backdrop-blur-2xl border-white/20 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

export function ClientStats({ stats }: ClientStatsProps) {
  const theme = getListCardTheme("client");

  return (
    <div className="mb-6">
      <div className="mb-5 text-center sm:text-left">
        <ModuleHeroLabel variant="client">Total Clients</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {stats.total}
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 max-w-xl">
        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Active
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <UserCheck className={cn("h-4 w-4", theme.statIcon)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.active}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="snap-start shrink-0 min-w-[150px] sm:min-w-0">
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                New This Month
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
                <UserPlus className={cn("h-4 w-4", theme.statIcon)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-black font-mono text-foreground">
                {stats.newThisMonth}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
