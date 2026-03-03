"use client";

import { Check, ChevronsUpDown, Loader2, Minus, Plus } from "lucide-react";
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
import { useMerchantSelector } from "./hooks/useMerchantSelector";
import type { MerchantResponse } from "@/features/merchants";

export const CREATE_NEW_MERCHANT_VALUE = -1;
export const NO_MERCHANT_VALUE = null;

interface MerchantSelectorProps {
  field: {
    value: number | null;
    onChange: (value: number | null) => void;
  };
  initialMerchant: MerchantResponse | null;
  mode: "create" | "edit";
  onSelect?: (merchant: MerchantResponse) => void;
}

export const MerchantSelector = ({
  field,
  initialMerchant,
  mode,
  onSelect,
}: MerchantSelectorProps) => {
  const {
    merchantQuery,
    openMerchants,
    merchants,
    loadingMerchants,
    isFetched,
    hasUserInteracted,
    selectedMerchant,
    handleMerchantSearch,
    handleMerchantSelect,
    toggleMerchantPopover,
    handleCreateNewMerchant,
    handleSelectNone,
  } = useMerchantSelector(initialMerchant, mode);

  const isCreateNewMode = field.value === CREATE_NEW_MERCHANT_VALUE;
  const isNoneMode = field.value === NO_MERCHANT_VALUE;

  const handleSelect = (merchant: MerchantResponse) => {
    field.onChange(merchant.id);
    handleMerchantSelect(merchant);
    onSelect?.(merchant);
  };

  const handleCreateNew = () => {
    field.onChange(CREATE_NEW_MERCHANT_VALUE);
    handleCreateNewMerchant();
  };

  const handleNone = () => {
    field.onChange(NO_MERCHANT_VALUE);
    handleSelectNone();
  };

  const triggerLabel = isNoneMode
    ? "None"
    : isCreateNewMode
      ? "➕ Create New Merchant"
      : selectedMerchant
        ? selectedMerchant.name
        : "Select merchant...";

  return (
    <FormItem>
      <FormLabel>Merchant</FormLabel>
      <Popover open={openMerchants} onOpenChange={toggleMerchantPopover}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openMerchants}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedMerchant &&
                  !isCreateNewMode &&
                  !isNoneMode &&
                  "text-muted-foreground",
              )}
              type="button"
            >
              {triggerLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search merchant..."
              value={merchantQuery}
              onValueChange={handleMerchantSearch}
            />
            {(loadingMerchants || isFetched) && (
              <CommandEmpty>
                {loadingMerchants ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No merchants found."
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
              <CommandItem
                value="create-new-merchant"
                onSelect={handleCreateNew}
                className="font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Merchant</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    isCreateNewMode ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
              {!loadingMerchants &&
                merchants.map((merchant) => (
                  <CommandItem
                    key={merchant.id}
                    value={String(merchant.id)}
                    onSelect={() => handleSelect(merchant)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedMerchant?.id === merchant.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {merchant.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};
