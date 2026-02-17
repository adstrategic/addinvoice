import { Card, CardContent } from "@/components/ui/card";
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
import React from "react";

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

  return (
    <div className="flex flex-col gap-4 sm:gap-4 sm:flex-row sm:items-center sm:flex-wrap mb-4 sm:mb-6">
      <div className="relative flex-1 min-w-0" data-tour-id="catalog-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products or services..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={businessId} onValueChange={onBusinessIdChange}>
        <SelectTrigger
          className="w-full sm:w-[200px]"
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
      <Select
        value={sortBy}
        onValueChange={(v) => onSortByChange(v as CatalogSortBy)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sequence">Default order</SelectItem>
          <SelectItem value="name">Name (A-Z)</SelectItem>
          <SelectItem value="price">Price (Low to High)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
