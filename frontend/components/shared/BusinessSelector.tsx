import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { useBusinessSelector } from "./hooks/useBusinessSelector";
import type { BusinessResponse } from "@/features/businesses";

interface BusinessSelectorProps {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
  initialBusiness: BusinessResponse | null;
  mode: "create" | "edit";
  onSelect?: (business: BusinessResponse) => void;
}

export const BusinessSelector = ({
  field,
  initialBusiness,
  mode,
  onSelect,
}: BusinessSelectorProps) => {
  const {
    businessQuery,
    openBusinesses,
    businesses,
    loadingBusinesses,
    hasUserInteracted,
    isFetched,
    selectedBusiness,
    handleBusinessSearch,
    handleBusinessSelect,
    toggleBusinessPopover,
  } = useBusinessSelector(initialBusiness, mode);

  // Función para manejar la selección
  const handleSelect = (business: BusinessResponse) => {
    field.onChange(business.id);
    handleBusinessSelect(business);
    onSelect?.(business);
  };

  return (
    <FormItem>
      <FormLabel>Business *</FormLabel>
      <Popover open={openBusinesses} onOpenChange={toggleBusinessPopover}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openBusinesses}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedBusiness && "text-muted-foreground"
              )}
              type="button"
            >
              {selectedBusiness
                ? selectedBusiness.name
                : "Select business..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search business..."
              value={businessQuery}
              onValueChange={handleBusinessSearch}
            />
            {(loadingBusinesses || isFetched) && (
              <CommandEmpty>
                {loadingBusinesses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No businesses found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a business...
                </CommandItem>
              )}
              {!loadingBusinesses &&
                businesses.map((business) => (
                  <CommandItem
                    key={business.id}
                    value={business.name}
                    onSelect={() => handleSelect(business)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBusiness?.id === business.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {business.name}
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




