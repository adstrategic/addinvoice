import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CatalogFilters({
  searchTerm,
  onSearchChange,
}: CatalogFiltersProps) {
  return (
    <Card className="mb-4 sm:mb-6 bg-card border-border">
      <CardContent className="pt-4 sm:pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or services..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

