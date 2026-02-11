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

/**
 * Business filter component for dashboard
 * Allows selecting a specific business or "All" to show data from all businesses
 */
export function DashboardBusinessFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedBusinessId = searchParams.get("businessId");

  const { data: businessesData, isLoading } = useBusinesses();
  const businesses = businessesData?.data || [];

  const handleBusinessChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (value === "all") {
        params.delete("businessId");
      } else {
        params.set("businessId", value);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Don't render if no businesses or still loading
  if (isLoading || businesses.length === 0) {
    return null;
  }

  const currentValue = selectedBusinessId || "all";

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleBusinessChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select business" />
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


