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
  { label: "Issued", value: "issued" },
  { label: "Viewed", value: "viewed" },
  { label: "Invoiced", value: "invoiced" },
] as const;

interface AdvanceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function AdvanceFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: AdvanceFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search advances..."
          className={getModuleSearchInputClass("advance")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <ModuleStatusTabs
        variant="advance"
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={onStatusChange}
      />
    </div>
  );
}
