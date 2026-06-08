"use client";

import { cn } from "@/lib/utils";
import {
  getListCardTheme,
  getModuleSearchInputClass,
  type ListCardVariant,
} from "./list-card-theme";

interface ModuleHeroLabelProps {
  variant: ListCardVariant;
  children: React.ReactNode;
  className?: string;
}

export function ModuleHeroLabel({
  variant,
  children,
  className,
}: ModuleHeroLabelProps) {
  const theme = getListCardTheme(variant);

  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-widest mb-1",
        theme.heroLabel,
        className,
      )}
    >
      {children}
    </p>
  );
}

interface StatusTab {
  label: string;
  value: string;
}

interface ModuleStatusTabsProps {
  variant: ListCardVariant;
  tabs: readonly StatusTab[];
  value: string;
  onChange: (value: string) => void;
  tourId?: string;
  className?: string;
}

export function ModuleStatusTabs({
  variant,
  tabs,
  value,
  onChange,
  tourId,
  className,
}: ModuleStatusTabsProps) {
  const theme = getListCardTheme(variant);

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-hide",
        className,
      )}
      data-tour-id={tourId}
    >
      {tabs.map(({ label, value: tabValue }) => (
        <button
          key={tabValue}
          type="button"
          onClick={() => onChange(tabValue)}
          className={cn(
            "inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-full whitespace-nowrap shrink-0 transition-all duration-200 border cursor-pointer outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            value === tabValue ? theme.statusActive : theme.statusInactive,
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export { getModuleSearchInputClass };
