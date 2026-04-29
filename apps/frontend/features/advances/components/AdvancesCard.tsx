import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { motion } from "framer-motion";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";
import { mapStatusToUI } from "../types/api";
import { useRouter } from "next/navigation";

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  issued: {
    label: "Issued",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
};

interface AdvanceCardProps {
  advance: AdvanceListItemResponse;
  index: number;
  onDelete: (advance: AdvanceListItemResponse) => void;
  onSend: (advance: AdvanceListItemResponse) => void;
}

/**
 * Individual estimate card component
 */
export function AdvanceCard({ advance, index, onDelete, onSend }: AdvanceCardProps) {
  const router = useRouter();

  const clientName =
    advance.client?.name || advance.client?.businessName || "Unknown client";
  const uiStatus = mapStatusToUI(advance.status);
  const statusInfo = statusConfig[uiStatus as keyof typeof statusConfig] || {
    label: uiStatus,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-foreground">
              {advance.projectName}
            </p>
            <Badge variant="secondary" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{clientName}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(advance.advanceDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSend(advance)}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/advances/${advance.sequence}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/advances/${advance.sequence}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(advance)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
