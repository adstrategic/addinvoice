import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientActionsProps {
  onOpenCreateModal: () => void;
}

export function ClientActions({ onOpenCreateModal }: ClientActionsProps) {
  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    // TODO: Implement import functionality
  };

  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Client */}
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
