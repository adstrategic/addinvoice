"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  Trash2,
} from "lucide-react";
import type { ClientResponse } from "@/features/clients";

interface ClientCardProps {
  client: ClientResponse;
  onViewDetails: (clientId: number) => void;
  onEdit: (sequence: number) => void;
  onViewInvoices: (client: ClientResponse) => void;
  onSendEmail: (client: ClientResponse) => void;
  onDelete: (client: ClientResponse) => void;
}

/**
 * Client card component
 * Displays client information and action menu
 */
export function ClientCard({
  client,
  onViewDetails,
  onEdit,
  onViewInvoices,
  onSendEmail,
  onDelete,
}: ClientCardProps) {
  console.log(client);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {client.name}
            </p>
            <Badge
              variant="default"
              className="bg-primary/20 text-primary hover:bg-primary/30"
            >
              {/* {client.status} */}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            {client.email && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{client.email}</span>
              </p>
            )}
            {client.phone && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                {client.phone}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[60px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {/* {client.totalInvoices} invoices */}
          </p>
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {/* ${(client.totalAmount || 0).toLocaleString()} */}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(client.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client.sequence)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewInvoices(client)}>
              <FileText className="h-4 w-4 mr-2" />
              View Invoices
            </DropdownMenuItem>
            {client.email && (
              <DropdownMenuItem onClick={() => onSendEmail(client)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(client)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
