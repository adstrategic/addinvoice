"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  ModuleStatusTabs,
  getModuleSearchInputClass,
} from "@/components/shared/module-ui";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Proposal", value: "proposal" },
  { label: "Invoiced", value: "invoiced" },
] as const;

interface EstimateFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function EstimateFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: EstimateFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative" data-tour-id="estimates-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search estimates..."
          className={getModuleSearchInputClass("estimate")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <ModuleStatusTabs
        variant="estimate"
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={onStatusChange}
        tourId="estimates-filter"
      />
    </div>
  );
}
