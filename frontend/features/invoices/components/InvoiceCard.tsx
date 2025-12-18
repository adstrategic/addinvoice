"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit,
  Download,
  Send,
  Trash2,
  FileText,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { InvoiceResponse } from "../types/api";
import { mapStatusToUI } from "../types/api";

// Status config (used for badge classes/labels)
const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  pending: {
    label: "Pending",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
  },
  issued: {
    label: "Issued",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
};

interface InvoiceCardProps {
  invoice: InvoiceResponse;
  index: number;
  onView: (sequence: number) => void;
  onEdit: (sequence: number) => void;
  onDownload: (invoice: InvoiceResponse) => void;
  onSend: (invoice: InvoiceResponse) => void;
  onMarkAsPaid: (invoice: InvoiceResponse) => void;
  onDelete: (invoice: InvoiceResponse) => void;
}

/**
 * Individual invoice card component
 */
export function InvoiceCard({
  invoice,
  index,
  onView,
  onEdit,
  onDownload,
  onSend,
  onMarkAsPaid,
  onDelete,
}: InvoiceCardProps) {
  const clientName =
    invoice.client?.name || invoice.client?.businessName || "Unknown Client";
  const amount = invoice.total || 0;
  const uiStatus = mapStatusToUI(invoice.status);
  const statusInfo = statusConfig[uiStatus as keyof typeof statusConfig] || {
    label: uiStatus,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.5 + index * 0.05,
      }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {invoice.invoiceNumber}
            </p>
            <Badge variant="secondary" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{clientName}</p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground text-sm sm:text-base">
            ${amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Due: {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(invoice.sequence)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            {invoice.status === "DRAFT" && (
              <DropdownMenuItem onClick={() => onEdit(invoice.sequence)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDownload(invoice)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSend(invoice)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </DropdownMenuItem>
            {uiStatus !== "paid" && (
              <DropdownMenuItem onClick={() => onMarkAsPaid(invoice)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(invoice)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
