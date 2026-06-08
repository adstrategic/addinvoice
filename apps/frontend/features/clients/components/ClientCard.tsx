"use client";

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
  Trash2,
} from "lucide-react";
import type { ClientResponse } from "@addinvoice/schemas";
import {
  ListCard,
  ListCardBody,
  ListCardMain,
  ListCardHeaderRow,
  ListCardSubtitle,
  ListCardFooter,
  ListCardFooterLabel,
  ListCardFooterValue,
  getClientDisplayLines,
} from "@/components/shared/list-card";

interface ClientCardProps {
  client: ClientResponse;
  index?: number;
  onViewDetails: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onSendEmail: (client: ClientResponse) => void;
  onDelete: (client: ClientResponse) => void;
}

export function ClientCard({
  client,
  index = 0,
  onViewDetails,
  onEdit,
  onSendEmail,
  onDelete,
}: ClientCardProps) {
  const { businessName: clientBusinessName } = getClientDisplayLines(client);

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors duration-200"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(client.sequence)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(client.sequence)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
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
  );

  return (
    <ListCard clickable={false} variant="client">
      <ListCardBody>
        <ListCardMain icon={Building2} variant="client">
          <ListCardHeaderRow title={client.name} actions={actionsMenu}>
            {clientBusinessName && (
              <ListCardSubtitle>{clientBusinessName}</ListCardSubtitle>
            )}
          </ListCardHeaderRow>
        </ListCardMain>

        <div className="hidden sm:block shrink-0">{actionsMenu}</div>
      </ListCardBody>

      {(client.email || client.phone) && (
        <ListCardFooter
          variant="client"
          className="justify-start gap-x-2 gap-y-1.5 sm:justify-between"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {client.email && (
              <>
                <Mail
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <ListCardFooterLabel>Email</ListCardFooterLabel>
                <ListCardFooterValue className="truncate">
                  {client.email}
                </ListCardFooterValue>
              </>
            )}
            {client.phone && !client.email && (
              <>
                <Phone
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="text-xs font-medium text-foreground">
                  {client.phone}
                </span>
              </>
            )}
          </div>
          {client.phone && client.email && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground">
                {client.phone}
              </span>
            </span>
          )}
        </ListCardFooter>
      )}
    </ListCard>
  );
}
