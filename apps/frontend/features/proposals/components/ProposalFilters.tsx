"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  ModuleStatusTabs,
  getModuleSearchInputClass,
} from "@/components/shared/module-ui";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Invoiced", value: "invoiced" },
] as const;

interface ProposalFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function ProposalFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: ProposalFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative" data-tour-id="proposals-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search proposals..."
          className={getModuleSearchInputClass("proposal")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <ModuleStatusTabs
        variant="proposal"
        tabs={STATUS_TABS}
        value={statusFilter}
        onChange={onStatusChange}
        tourId="proposals-filter"
      />
    </div>
  );
}
