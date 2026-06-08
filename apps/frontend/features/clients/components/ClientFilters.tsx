"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getModuleSearchInputClass } from "@/components/shared/module-ui";

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ClientFilters({
  searchTerm,
  onSearchChange,
}: ClientFiltersProps) {
  return (
    <div className="mb-6">
      <div className="relative" data-tour-id="clients-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className={getModuleSearchInputClass("client")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
}
