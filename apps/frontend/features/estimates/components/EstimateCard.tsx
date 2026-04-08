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
  Receipt,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import { formatCurrency } from "@/lib/utils";
import { mapStatusToUI } from "../types/api";
import { useRouter } from "next/navigation";

// Status config (used for badge classes/labels)
const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
  overdue: {
    label: "Overdue",
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
  accepted: {
    label: "Accepted",
    className: "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30",
  },
  sent: {
    label: "Sent",
    className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-primary/20 text-primary hover:bg-primary/30",
  },
};

interface EstimateCardProps {
  estimate: EstimateDashboardResponse;
  index: number;
  onDownload: (estimate: EstimateDashboardResponse) => void;
  onSend: (estimate: EstimateDashboardResponse) => void;
  onDelete: (estimate: EstimateDashboardResponse) => void;
  onAccept?: (estimate: EstimateDashboardResponse) => void;
  onConvertToInvoice?: (estimate: EstimateDashboardResponse) => void;
  linkOnly?: boolean;
}

/**
 * Individual estimate card component
 */
export function EstimateCard({
  estimate,
  index,
  onDownload,
  onSend,
  onDelete,
  onAccept,
  onConvertToInvoice,
  linkOnly = false,
}: EstimateCardProps) {
  const router = useRouter();
  const clientName =
    estimate.client?.name || estimate.client?.businessName || "Unknown Client";
  const businessName = estimate.business?.name;
  const uiStatus = mapStatusToUI(estimate.status);
  const statusInfo = statusConfig[uiStatus as keyof typeof statusConfig] || {
    label: uiStatus,
    className: "bg-muted text-muted-foreground",
  };

  const cardContent = (
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
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <p className="text-sm font-semibold text-muted-foreground truncate">
              {businessName}
            </p>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {estimate.estimateNumber}
            </p>
            <Badge variant="secondary" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{clientName}</p>
          {estimate.status === "REJECTED" &&
            estimate.rejectionReason?.trim() && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={estimate.rejectionReason}>
                Rejection reason: {estimate.rejectionReason}
              </p>
            )}
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {formatCurrency(estimate.total)}
          </p>
        </div>
        {!linkOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/estimates/${estimate.sequence}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {(estimate.status === "DRAFT" || estimate.status === "REJECTED") && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/estimates/${estimate.sequence}/edit`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDownload(estimate)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              {(estimate.itemCount ?? 0) > 0 && (
                <DropdownMenuItem onClick={() => onSend(estimate)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </DropdownMenuItem>
              )}
              {estimate.status === "SENT" && onAccept && (
                <DropdownMenuItem onClick={() => onAccept(estimate)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as accepted
                </DropdownMenuItem>
              )}
              {estimate.status === "ACCEPTED" && onConvertToInvoice && (
                <DropdownMenuItem onClick={() => onConvertToInvoice(estimate)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </DropdownMenuItem>
              )}

              {estimate.status === "DRAFT" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(estimate)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );

  if (linkOnly) {
    return (
      <Link href={`/estimates/${estimate.sequence}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
