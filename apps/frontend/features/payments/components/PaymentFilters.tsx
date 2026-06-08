"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DashboardBusinessFilter } from "@/components/dashboard-business-filter";
import { getModuleSearchInputClass } from "@/components/shared/module-ui";

interface PaymentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  businessId: string;
  onBusinessIdChange: (value: string) => void;
}

export function PaymentFilters({
  searchTerm,
  onSearchChange,
  businessId,
  onBusinessIdChange,
}: PaymentFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
          className={getModuleSearchInputClass("payment")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <DashboardBusinessFilter
        businessId={businessId}
        onBusinessIdChange={onBusinessIdChange}
      />
    </div>
  );
}
