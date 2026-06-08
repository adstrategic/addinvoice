"use client";

import type { CatalogListStats } from "../schema/catalog.schema";
import { ModuleHeroLabel } from "@/components/shared/module-ui";

interface CatalogStatsProps {
  stats: CatalogListStats;
}

export function CatalogStats({ stats }: CatalogStatsProps) {
  return (
    <div className="mb-6">
      <div className="text-center sm:text-left">
        <ModuleHeroLabel variant="catalog">Total Products</ModuleHeroLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
          {stats.total}
        </h2>
      </div>
    </div>
  );
}
