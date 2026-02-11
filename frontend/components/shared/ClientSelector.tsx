import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
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

// Special value to represent "Create New Client" mode
export const CREATE_NEW_CLIENT_VALUE = -1;

interface ClientSelectorProps {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
  initialClient: ClientResponse | null;
  mode: "create" | "edit";
  onSelect?: (client: ClientResponse) => void;
}

export const ClientSelector = ({
  field,
  initialClient,
  mode,
  onSelect,
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
    handleCreateNewClient,
  } = useClientSelector(initialClient, mode);

  const isCreateNewMode = field.value === CREATE_NEW_CLIENT_VALUE;

  // Función para manejar la selección
  const handleSelect = (client: ClientResponse) => {
    field.onChange(client.id);
    handleClientSelect(client);
    onSelect?.(client);
  };

  // Función para manejar "Create New Client"
  const handleCreateNew = () => {
    field.onChange(CREATE_NEW_CLIENT_VALUE);
    handleCreateNewClient();
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
                !selectedClient && !isCreateNewMode && "text-muted-foreground"
              )}
              type="button"
            >
              {isCreateNewMode
                ? "➕ Create New Client"
                : selectedClient
                ? selectedClient.name
                : "Select customer..."}
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
              {/* Create New Client option - always first */}
              <CommandItem
                value="create-new-client"
                onSelect={handleCreateNew}
                className="font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Client</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    isCreateNewMode ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
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
