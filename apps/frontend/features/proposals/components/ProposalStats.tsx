"use client";

import type { ProposalListStats } from "@addinvoice/schemas";
import { ModuleHeroLabel } from "@/components/shared/module-ui";

interface ProposalStatsProps {
  stats: ProposalListStats;
}

export function ProposalStats({ stats }: ProposalStatsProps) {
  return (
    <div className="mb-6">
      <div className="text-center sm:text-left">
        <ModuleHeroLabel variant="proposal">Total Proposals</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {stats.total}
        </h2>
      </div>
    </div>
  );
}
