"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { useBusinesses } from "@/features/businesses";
import { Search } from "lucide-react";
import { getModuleSearchInputClass } from "@/components/shared/module-ui";

export type CatalogSortBy = "sequence" | "name" | "price";

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  businessId: string;
  onBusinessIdChange: (value: string) => void;
  sortBy: CatalogSortBy;
  onSortByChange: (value: CatalogSortBy) => void;
}

export function CatalogFilters({
  searchTerm,
  onSearchChange,
  businessId,
  onBusinessIdChange,
  sortBy,
  onSortByChange,
}: CatalogFiltersProps) {
  const { data: businessesData } = useBusinesses();
  const businesses = businessesData?.data ?? [];
  const showBusinessFilter = businesses.length > 1;

  return (
    <div className="mb-6 space-y-4">
      <div className="relative" data-tour-id="catalog-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products or services..."
          className={getModuleSearchInputClass("catalog")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showBusinessFilter && (
          <Select value={businessId} onValueChange={onBusinessIdChange}>
            <SelectTrigger
              className="w-full sm:w-[200px] h-11 bg-secondary/50 border-transparent rounded-xl"
              data-tour-id="catalog-filter"
            >
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
        )}

        <Select
          value={sortBy}
          onValueChange={(v) => onSortByChange(v as CatalogSortBy)}
        >
          <SelectTrigger className="w-full sm:w-[200px] h-11 bg-secondary/50 border-transparent rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequence">Default order</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="price">Price (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
