"use client";

import { plainTextFromTipTapJson } from "@/lib/rich-text-plain";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, MoreVertical, Edit, Trash2 } from "lucide-react";
import type { CatalogResponse } from "@/features/catalog";
import { formatCurrency } from "@/lib/utils";
import {
  ListCard,
  ListCardBody,
  ListCardMain,
  ListCardHeaderRow,
  ListCardMetricGrid,
  ListCardMetricsDesktop,
  ListCardFooter,
} from "@/components/shared/list-card";

interface CatalogCardProps {
  catalog: CatalogResponse;
  onEdit: (sequence: number) => void;
  onDelete: (catalog: CatalogResponse) => void;
}

const quantityUnitLabels = {
  UNITS: "UNIT",
  HOURS: "HOUR",
  DAYS: "DAY",
} as const;

function formatPricePerUnit(price: number, unit: keyof typeof quantityUnitLabels) {
  return `${formatCurrency(price)} per ${quantityUnitLabels[unit]}`;
}

export function CatalogCard({
  catalog,
  onEdit,
  onDelete,
}: CatalogCardProps) {
  const description =
    plainTextFromTipTapJson(catalog.description as unknown) ||
    "No description provided.";
  const priceLabel = formatPricePerUnit(catalog.price, catalog.quantityUnit);

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-sky-500/10 hover:text-sky-600 transition-colors duration-200"
        >
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
  );

  const priceMetric = {
    label: "Price",
    value: priceLabel,
    valueClassName: "text-sky-600",
  };

  return (
    <ListCard clickable={false} variant="catalog">
      <ListCardBody>
        <ListCardMain icon={Package} variant="catalog">
          <ListCardHeaderRow title={catalog.name} actions={actionsMenu} />

          <ListCardMetricGrid variant="catalog" metrics={[priceMetric]} />
        </ListCardMain>

        <ListCardMetricsDesktop metrics={[priceMetric]} actions={actionsMenu} />
      </ListCardBody>

      <ListCardFooter variant="catalog">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </ListCardFooter>
    </ListCard>
  );
}
