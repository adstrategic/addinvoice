"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import type { CatalogResponse } from "@/features/catalog";

interface CatalogCardProps {
  catalog: CatalogResponse;
  onEdit: (sequence: number) => void;
  onDelete: (catalog: CatalogResponse) => void;
}

/**
 * Catalog card component
 * Displays catalog item information and action menu
 */
export function CatalogCard({
  catalog,
  onEdit,
  onDelete,
}: CatalogCardProps) {
  const quantityUnitLabels = {
    UNITS: "Units",
    HOURS: "Hours",
    DAYS: "Days",
  };

  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{catalog.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {quantityUnitLabels[catalog.quantityUnit]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(catalog.sequence)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(catalog)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
          {catalog.description || "No description provided."}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            ${catalog.price.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

