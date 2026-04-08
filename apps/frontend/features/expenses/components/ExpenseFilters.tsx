import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Search, CalendarIcon } from "lucide-react";
import React from "react";
import {
  getWorkCategoryIcon,
  useWorkCategories,
} from "@/features/work-categories";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";

interface ExpenseFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  workCategoryId: string;
  onWorkCategoryIdChange: (value: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateRangeChange: (
    dateFrom: string | undefined,
    dateTo: string | undefined,
  ) => void;
}

export function ExpenseFilters({
  searchTerm,
  onSearchChange,
  workCategoryId,
  onWorkCategoryIdChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
}: ExpenseFiltersProps) {
  const { data: categoriesData } = useWorkCategories();
  const categories = categoriesData?.data ?? [];

  const fromDate = dateFrom ? parseISO(dateFrom) : undefined;
  const toDate = dateTo ? parseISO(dateTo) : undefined;
  const selectedRange: DateRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined;

  const dateLabel =
    fromDate && toDate
      ? `${format(fromDate, "yyyy-MM-dd")} – ${format(toDate, "yyyy-MM-dd")}`
      : fromDate
        ? `From ${format(fromDate, "yyyy-MM-dd")}`
        : toDate
          ? `Until ${format(toDate, "yyyy-MM-dd")}`
          : "All dates";

  return (
    <div
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6"
      data-tour-id="expenses-search"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          className="pl-10 bg-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal",
                !fromDate && !toDate && "text-muted-foreground",
                "bg-white",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <p className="text-sm font-medium">Date range</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDateRangeChange(undefined, undefined)}
                disabled={!fromDate && !toDate}
              >
                Clear
              </Button>
            </div>
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                const nextFrom = range?.from
                  ? format(range.from, "yyyy-MM-dd")
                  : undefined;
                const nextTo = range?.to
                  ? format(range.to, "yyyy-MM-dd")
                  : undefined;
                onDateRangeChange(nextFrom, nextTo);
              }}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <Select value={workCategoryId} onValueChange={onWorkCategoryIdChange}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => {
              const Icon = getWorkCategoryIcon(category.icon);
              return (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    {category.name}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
