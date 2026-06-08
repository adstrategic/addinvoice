"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getDocumentStatusStyle,
  type DocumentType,
} from "@/lib/document-status-styles";

interface DocumentStatusBadgeProps {
  uiStatus: string;
  documentType?: DocumentType;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "text-[10px] uppercase font-bold tracking-wider",
  md: "text-xs font-semibold",
} as const;

export function DocumentStatusBadge({
  uiStatus,
  documentType,
  size = "sm",
  className,
}: DocumentStatusBadgeProps) {
  const { label, className: statusClass } = getDocumentStatusStyle(
    uiStatus,
    documentType,
  );

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 shrink-0",
        SIZE_CLASSES[size],
        statusClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}
