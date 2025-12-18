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
import { useClientSelector } from "./hooks/useClientSelector";
import type { ClientResponse } from "@/features/clients";

interface ClientSelectorProps {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
  initialClient: ClientResponse | null;
}

export const ClientSelector = ({
  field,
  initialClient,
}: ClientSelectorProps) => {
  const {
    clientQuery,
    openClients,
    clients,
    loadingClients,
    hasUserInteracted,
    isFetched,
    selectedClient,
    handleClientSearch,
    handleClientSelect,
    toggleClientPopover,
  } = useClientSelector(initialClient);

  // Función para manejar la selección
  const handleSelect = (client: ClientResponse) => {
    field.onChange(client.id);
    handleClientSelect(client);
  };

  return (
    <FormItem>
      <FormLabel>Customer *</FormLabel>
      <Popover open={openClients} onOpenChange={toggleClientPopover}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openClients}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedClient && "text-muted-foreground"
              )}
              type="button"
            >
              {selectedClient ? selectedClient.name : "Select customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search customer..."
              value={clientQuery}
              onValueChange={handleClientSearch}
            />
            {(loadingClients || isFetched) && (
              <CommandEmpty>
                {loadingClients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No customers found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a customer...
                </CommandItem>
              )}
              {!loadingClients &&
                clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.id === client.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {client.name}
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
