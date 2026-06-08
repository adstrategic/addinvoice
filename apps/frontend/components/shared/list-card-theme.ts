import { cn } from "@/lib/utils";

export type ListCardVariant =
  | "invoice"
  | "estimate"
  | "proposal"
  | "advance"
  | "payment"
  | "expense"
  | "client"
  | "catalog";

export interface ListCardTheme {
  card: string;
  iconWrap: string;
  metricGrid: string;
  footer: string;
  heroLabel: string;
  statusActive: string;
  statusInactive: string;
  searchFocus: string;
  statIconWrap: string;
  statIcon: string;
}

export const LIST_CARD_THEMES: Record<ListCardVariant, ListCardTheme> = {
  invoice: {
    card: "border-l-[3px] border-l-primary hover:border-primary/30",
    iconWrap:
      "rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
    metricGrid: "bg-primary/5 border-primary/15",
    footer: "border-primary/15",
    heroLabel: "text-primary",
    statusActive:
      "border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 shadow-sm",
    statusInactive:
      "border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/10 dark:text-foreground dark:hover:bg-primary/15",
    searchFocus: "focus-visible:border-primary",
    statIconWrap: "bg-primary/15 ring-1 ring-primary/20",
    statIcon: "text-primary",
  },
  estimate: {
    card: "border-l-[3px] border-l-orange-500 hover:border-orange-500/30",
    iconWrap:
      "rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white",
    metricGrid: "bg-orange-500/5 border-orange-500/15",
    footer: "border-orange-500/15",
    heroLabel: "text-orange-600 dark:text-orange-400",
    statusActive:
      "border-orange-500 bg-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 dark:border-orange-500 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600 dark:hover:border-orange-600 shadow-sm",
    statusInactive:
      "border-orange-500/20 bg-orange-500/5 text-foreground hover:bg-orange-500/10 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-foreground dark:hover:bg-orange-500/15",
    searchFocus: "focus-visible:border-orange-500/50",
    statIconWrap: "bg-orange-500/15 ring-1 ring-orange-500/20",
    statIcon: "text-orange-600 dark:text-orange-400",
  },
  proposal: {
    card: "border-l-[3px] border-l-violet-500 hover:border-violet-500/30",
    iconWrap:
      "rounded-lg bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white",
    metricGrid: "bg-violet-500/5 border-violet-500/15",
    footer: "border-violet-500/15",
    heroLabel: "text-violet-600 dark:text-violet-400",
    statusActive:
      "border-violet-500 bg-violet-500 text-white hover:bg-violet-600 hover:border-violet-600 dark:border-violet-500 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-600 dark:hover:border-violet-600 shadow-sm",
    statusInactive:
      "border-violet-500/20 bg-violet-500/5 text-foreground hover:bg-violet-500/10 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-foreground dark:hover:bg-violet-500/15",
    searchFocus: "focus-visible:border-violet-500/50",
    statIconWrap: "bg-violet-500/15 ring-1 ring-violet-500/20",
    statIcon: "text-violet-600 dark:text-violet-400",
  },
  advance: {
    card: "border-l-[3px] border-l-blue-500 hover:border-blue-500/30",
    iconWrap:
      "rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white",
    metricGrid: "bg-blue-500/5 border-blue-500/15",
    footer: "border-blue-500/15",
    heroLabel: "text-blue-600 dark:text-blue-400",
    statusActive:
      "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600 dark:border-blue-500 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 shadow-sm",
    statusInactive:
      "border-blue-500/20 bg-blue-500/5 text-foreground hover:bg-blue-500/10 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-foreground dark:hover:bg-blue-500/15",
    searchFocus: "focus-visible:border-blue-500/50",
    statIconWrap: "bg-blue-500/15 ring-1 ring-blue-500/20",
    statIcon: "text-blue-600 dark:text-blue-400",
  },
  payment: {
    card: "border-l-[3px] border-l-emerald-500 hover:border-emerald-500/30",
    iconWrap:
      "rounded-full bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
    metricGrid: "bg-emerald-500/5 border-emerald-500/15",
    footer: "border-emerald-500/15",
    heroLabel: "text-emerald-600 dark:text-emerald-400",
    statusActive:
      "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600 dark:hover:border-emerald-600 shadow-sm",
    statusInactive:
      "border-emerald-500/20 bg-emerald-500/5 text-foreground hover:bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-foreground dark:hover:bg-emerald-500/15",
    searchFocus: "focus-visible:border-emerald-500/50",
    statIconWrap: "bg-emerald-500/15 ring-1 ring-emerald-500/20",
    statIcon: "text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    card: "border-l-[3px] border-l-amber-500 hover:border-amber-500/30",
    iconWrap:
      "rounded-2xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    metricGrid: "bg-amber-500/5 border-amber-500/15",
    footer: "border-amber-500/15",
    heroLabel: "text-amber-600 dark:text-amber-400",
    statusActive:
      "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 dark:border-amber-500 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600 dark:hover:border-amber-600 shadow-sm",
    statusInactive:
      "border-amber-500/20 bg-amber-500/5 text-foreground hover:bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-foreground dark:hover:bg-amber-500/15",
    searchFocus: "focus-visible:border-amber-500/50",
    statIconWrap: "bg-amber-500/15 ring-1 ring-amber-500/20",
    statIcon: "text-amber-600 dark:text-amber-400",
  },
  client: {
    card: "border-l-[3px] border-l-indigo-500 hover:border-indigo-500/30",
    iconWrap:
      "rounded-full bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white",
    metricGrid: "bg-indigo-500/5 border-indigo-500/15",
    footer: "border-indigo-500/15",
    heroLabel: "text-indigo-600 dark:text-indigo-400",
    statusActive:
      "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 hover:border-indigo-600 dark:border-indigo-500 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 shadow-sm",
    statusInactive:
      "border-indigo-500/20 bg-indigo-500/5 text-foreground hover:bg-indigo-500/10 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-foreground dark:hover:bg-indigo-500/15",
    searchFocus: "focus-visible:border-indigo-500/50",
    statIconWrap: "bg-indigo-500/15 ring-1 ring-indigo-500/20",
    statIcon: "text-indigo-600 dark:text-indigo-400",
  },
  catalog: {
    card: "border-l-[3px] border-l-sky-500 hover:border-sky-500/30",
    iconWrap:
      "rounded-md bg-sky-500/10 text-sky-600 group-hover:bg-sky-500 group-hover:text-white",
    metricGrid: "bg-sky-500/5 border-sky-500/15",
    footer: "border-sky-500/15",
    heroLabel: "text-sky-600 dark:text-sky-400",
    statusActive:
      "border-sky-500 bg-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 dark:border-sky-500 dark:bg-sky-500 dark:text-white dark:hover:bg-sky-600 dark:hover:border-sky-600 shadow-sm",
    statusInactive:
      "border-sky-500/20 bg-sky-500/5 text-foreground hover:bg-sky-500/10 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-foreground dark:hover:bg-sky-500/15",
    searchFocus: "focus-visible:border-sky-500/50",
    statIconWrap: "bg-sky-500/15 ring-1 ring-sky-500/20",
    statIcon: "text-sky-600 dark:text-sky-400",
  },
};

export function getListCardTheme(variant: ListCardVariant = "invoice") {
  return LIST_CARD_THEMES[variant];
}

export function getModuleSearchInputClass(variant: ListCardVariant) {
  const theme = getListCardTheme(variant);
  return cn(
    "pl-11 h-12 bg-secondary/50 border-transparent rounded-xl",
    theme.searchFocus,
  );
}
