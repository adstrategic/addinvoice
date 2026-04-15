import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
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
import type { ClientResponse } from "@addinvoice/schemas";

interface ClientSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  initialClient: ClientResponse | null;
  mode: "create" | "edit";
  /** When false, hides “Create New Client” (e.g. voice invoice flow). Default true. */
  showCreateNew?: boolean;
  onSelect?: (client: ClientResponse) => void;
  onCreateNew?: () => void;
}

export const ClientSelector = ({
  value,
  onValueChange,
  initialClient,
  mode,
  showCreateNew = true,
  onSelect,
  onCreateNew,
}: ClientSelectorProps) => {
  const {
    clientQuery,
    openClients,
    clients,
    loadingClients,
    isFetched,
    selectedClient,
    handleClientSearch,
    toggleClientPopover,
    closePopover,
  } = useClientSelector(value, initialClient, mode);

  const handleSelect = (client: ClientResponse) => {
    onValueChange(client.id);
    closePopover();
    onSelect?.(client);
  };

  const handleCreateNew = () => {
    closePopover();
    onCreateNew?.();
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
                !selectedClient && value <= 0 && "text-muted-foreground",
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
            <CommandGroup className="max-h-64 overflow-auto">
              {showCreateNew ? (
                <CommandItem
                  value="create-new-client"
                  onSelect={handleCreateNew}
                  className="font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create New Client</span>
                </CommandItem>
              ) : null}
              {loadingClients && (
                <CommandItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </CommandItem>
              )}
              {!loadingClients && isFetched && clients.length === 0 && (
                <CommandItem disabled>No customers found.</CommandItem>
              )}
              {!loadingClients &&
                clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.id}:${client.name}`}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0",
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
