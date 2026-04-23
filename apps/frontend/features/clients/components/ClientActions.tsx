import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";

interface ClientActionsProps {
  onCreateByVoice: () => void;
  onOpenCreateModal: () => void;
}

export function ClientActions({
  onCreateByVoice,
  onOpenCreateModal,
}: ClientActionsProps) {
  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    // TODO: Implement import functionality
  };

  return (
    <div className="flex gap-3 w-full md:w-auto">
      {/* Primary Action - Create Client */}
      <Button
        type="button"
        variant="outline"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-4 w-4" />
        Add by voice
      </Button>
      <div data-tour-id="clients-create-btn">
        <Button onClick={onOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Secondary Actions */}
      {/* TODO: Add export and import functionality */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Clients
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Clients
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
}
