"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { getListCardTheme, type ListCardVariant } from "./list-card-theme";
import type { HTMLAttributes } from "react";

export type { ListCardVariant } from "./list-card-theme";

export const LIST_CARD_CLASS =
  "group rounded-xl border border-border/60 bg-card/50 p-4 transition-all duration-200 hover:bg-card hover:shadow-md flex flex-col";

interface ListCardProps extends HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
  variant?: ListCardVariant;
}

export function ListCard({
  children,
  className,
  clickable = true,
  variant = "invoice",
  ...props
}: ListCardProps) {
  const theme = getListCardTheme(variant);

  return (
    <div
      className={cn(
        LIST_CARD_CLASS,
        theme.card,
        clickable && "cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ListCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start sm:items-center justify-between gap-3 sm:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListCardMain({
  children,
  icon: Icon,
  variant = "invoice",
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: ListCardVariant;
}) {
  const theme = getListCardTheme(variant);

  return (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      {Icon && (
        <div
          className={cn(
            "h-10 w-10 hidden sm:flex items-center justify-center shrink-0 transition-colors duration-200",
            theme.iconWrap,
          )}
        >
          <Icon className="h-5 w-5 transition-colors duration-200" />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function ListCardHeaderRow({
  title,
  badge,
  actions,
  children,
}: {
  title?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5 flex-1">
          {(title || badge) && (
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <div className="font-semibold text-foreground truncate">
                  {title}
                </div>
              )}
              {badge}
            </div>
          )}
          {children}
        </div>
        {actions && <div className="sm:hidden shrink-0">{actions}</div>}
      </div>
    </>
  );
}

export function ListCardSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium text-foreground truncate">{children}</p>
  );
}

export function ListCardMeta({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground truncate">{children}</p>;
}

export interface ListCardMetric {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export function ListCardMetricGrid({
  metrics,
  variant = "invoice",
}: {
  metrics: ListCardMetric[];
  variant?: ListCardVariant;
}) {
  const theme = getListCardTheme(variant);
  const cols =
    metrics.length === 1
      ? "grid-cols-1"
      : metrics.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div
      className={cn(
        "mt-3 grid gap-2 rounded-lg border p-2.5 sm:hidden",
        theme.metricGrid,
        cols,
      )}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {metric.label}
          </p>
          <div
            className={cn(
              "text-sm font-semibold font-mono tabular-nums truncate",
              metric.valueClassName,
            )}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListCardMetricsDesktop({
  metrics,
  actions,
}: {
  metrics: ListCardMetric[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="hidden sm:flex items-center gap-6 shrink-0">
      <div className="text-right space-y-0.5">
        {metrics.map((metric, index) => (
          <div key={metric.label}>
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
                index > 0 && "pt-1",
              )}
            >
              {metric.label}
            </p>
            <div
              className={cn(
                "font-semibold font-mono tabular-nums",
                metric.valueClassName,
              )}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      {actions}
    </div>
  );
}

export function ListCardFooter({
  icon: Icon,
  iconClassName,
  children,
  className,
  variant = "invoice",
}: {
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  className?: string;
  variant?: ListCardVariant;
}) {
  const theme = getListCardTheme(variant);

  return (
    <div
      className={cn(
        "mt-3 pt-2.5 border-t flex items-center gap-1.5 flex-wrap",
        theme.footer,
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground",
            iconClassName,
          )}
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}

export function ListCardFooterLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

export function ListCardFooterValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-xs font-medium text-foreground", className)}>
      {children}
    </span>
  );
}

export function ListCardActionsDesktop({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="hidden sm:block shrink-0">{children}</div>;
}

/** Client name + optional registered business name without duplicating the same value. */
export function getClientDisplayLines(
  client?: { name?: string; businessName?: string | null } | null,
  fallback = "Unknown Client",
) {
  const name = client?.name?.trim() || fallback;
  const businessName = client?.businessName?.trim();
  const showBusinessName =
    !!businessName && businessName.toLowerCase() !== name.toLowerCase();

  return {
    name,
    businessName: showBusinessName ? businessName : undefined,
  };
}
