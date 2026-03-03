"use client";

import { Check, ChevronsUpDown, Loader2, Minus } from "lucide-react";
import { getWorkCategoryIcon } from "@/features/work-categories";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useWorkCategorySelector } from "./hooks/useWorkCategorySelector";
import type { WorkCategoryResponse } from "@/features/work-categories";

interface WorkCategorySelectorProps {
  field: {
    value: number | null;
    onChange: (value: number | null) => void;
  };
  initialCategory: WorkCategoryResponse | null;
  mode: "create" | "edit";
}

export const WorkCategorySelector = ({
  field,
  initialCategory,
  mode,
}: WorkCategorySelectorProps) => {
  const {
    categoryQuery,
    openCategories,
    categories,
    loadingCategories,
    isFetched,
    selectedCategory,
    handleCategorySearch,
    handleCategorySelect,
    toggleCategoryPopover,
    handleSelectNone,
  } = useWorkCategorySelector(initialCategory, mode);

  const isNoneMode = field.value === null;

  const handleSelect = (category: WorkCategoryResponse) => {
    field.onChange(category.id);
    handleCategorySelect(category);
  };

  const handleNone = () => {
    field.onChange(null);
    handleSelectNone();
  };

  const triggerLabel = isNoneMode
    ? "None"
    : selectedCategory
      ? selectedCategory.name
      : "Select category...";

  const TriggerIcon = selectedCategory
    ? getWorkCategoryIcon(selectedCategory.icon)
    : null;

  return (
    <FormItem>
      <FormLabel>Category (optional)</FormLabel>
      <Popover open={openCategories} onOpenChange={toggleCategoryPopover}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCategories}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedCategory && !isNoneMode && "text-muted-foreground",
              )}
              type="button"
            >
              <span className="flex items-center gap-2">
                {TriggerIcon && <TriggerIcon className="h-4 w-4 shrink-0" />}
                {triggerLabel}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search category..."
              value={categoryQuery}
              onValueChange={handleCategorySearch}
            />
            {(loadingCategories || isFetched) && (
              <CommandEmpty>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No categories found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem value="none" onSelect={handleNone}>
                <Minus className="mr-2 h-4 w-4" />
                <span>None</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    isNoneMode ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
              {!loadingCategories &&
                categories.map((category) => {
                  const Icon = getWorkCategoryIcon(category.icon);
                  return (
                    <CommandItem
                      key={category.id}
                      value={String(category.id)}
                      onSelect={() => handleSelect(category)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      {category.name}
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory?.id === category.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};
