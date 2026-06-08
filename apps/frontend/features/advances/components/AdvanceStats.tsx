"use client";

import type { z } from "zod";
import type { advanceListStatsSchema } from "@addinvoice/schemas";
import { ModuleHeroLabel } from "@/components/shared/module-ui";

type AdvanceListStats = z.infer<typeof advanceListStatsSchema>;

interface AdvanceStatsProps {
  stats: AdvanceListStats;
}

export function AdvanceStats({ stats }: AdvanceStatsProps) {
  return (
    <div className="mb-6">
      <div className="text-center sm:text-left">
        <ModuleHeroLabel variant="advance">Total Advances</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {stats.total}
        </h2>
      </div>
    </div>
  );
}
