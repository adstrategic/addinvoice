import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/shared/DocumentStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Eye,
  Send,
  Ban,
} from "lucide-react";
import { canVoidAdvance } from "@/lib/document-void";
import { canSendAdvance } from "@/lib/is-document-public-issued";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";
import { mapStatusToUI } from "../types/api";
import { useRouter } from "next/navigation";
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

interface AdvanceCardProps {
  advance: AdvanceListItemResponse;
  index: number;
  onDelete: (advance: AdvanceListItemResponse) => void;
  onVoid: (advance: AdvanceListItemResponse) => void;
  onSend: (advance: AdvanceListItemResponse) => void;
}

function formatCardDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdvanceCard({
  advance,
  index,
  onDelete,
  onVoid,
  onSend,
}: AdvanceCardProps) {
  const router = useRouter();

  const { name: clientName, businessName: clientBusinessName } =
    getClientDisplayLines(advance.client, "Unknown client");
  const uiStatus = mapStatusToUI(advance.status);

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canSendAdvance(advance) && (
          <DropdownMenuItem onClick={() => onSend(advance)}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </DropdownMenuItem>
        )}
        {advance.status === "DRAFT" && (
          <DropdownMenuItem
            onClick={() => router.push(`/advances/${advance.sequence}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => router.push(`/advances/${advance.sequence}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        {advance.status === "DRAFT" && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(advance)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
        {canVoidAdvance(advance) && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onVoid(advance)}
          >
            <Ban className="mr-2 h-4 w-4" />
            Mark as voided
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <ListCard clickable={false} variant="advance">
      <ListCardBody>
        <ListCardMain icon={FileText} variant="advance">
          <ListCardHeaderRow
            title={advance.projectName}
            badge={
              <DocumentStatusBadge
                uiStatus={uiStatus}
                documentType="advance"
              />
            }
            actions={actionsMenu}
          >
            <ListCardSubtitle>{clientName}</ListCardSubtitle>
            {clientBusinessName && (
              <p className="text-xs text-muted-foreground truncate">
                {clientBusinessName}
              </p>
            )}
          </ListCardHeaderRow>
        </ListCardMain>

        <div className="hidden sm:block shrink-0">{actionsMenu}</div>
      </ListCardBody>

      <ListCardFooter variant="advance" icon={Calendar}>
        <ListCardFooterLabel>Advance date</ListCardFooterLabel>
        <ListCardFooterValue>
          {formatCardDate(advance.advanceDate)}
        </ListCardFooterValue>
      </ListCardFooter>
    </ListCard>
  );
}
