"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  ModuleStatusTabs,
  getModuleSearchInputClass,
} from "@/components/shared/module-ui";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Issued", value: "issued" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Viewed", value: "viewed" },
  { label: "Draft", value: "draft" },
] as const;

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: InvoiceFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative" data-tour-id="invoices-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          className={getModuleSearchInputClass("invoice")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <ModuleStatusTabs
        variant="invoice"
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={onStatusChange}
        tourId="invoices-filter"
      />
    </div>
  );
}
