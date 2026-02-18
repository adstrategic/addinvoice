"use client";

import { useBusinesses } from "@/features/businesses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

interface DashboardBusinessFilterProps {
  businessId: string;
  onBusinessIdChange: (value: string) => void;
}

/**
 * Business filter component for dashboard
 * Allows selecting a specific business or "All" to show data from all businesses
 */
export function DashboardBusinessFilter({
  businessId,
  onBusinessIdChange,
}: DashboardBusinessFilterProps) {
  const { data: businessesData } = useBusinesses();
  const businesses = businessesData?.data ?? [];

  return (
    <div className="flex items-center gap-2">
      <Select value={businessId} onValueChange={onBusinessIdChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filter by Business" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Businesses</SelectItem>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id.toString()}>
              {business.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
