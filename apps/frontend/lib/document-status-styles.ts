export type DocumentType = "invoice" | "estimate" | "proposal" | "advance";

export interface DocumentStatusStyle {
  label: string;
  className: string;
}

/** Shared status badge colors — list cards and detail pages use the same tokens. */
export const DOCUMENT_STATUS_STYLES: Record<string, DocumentStatusStyle> = {
  paid: {
    label: "Paid",
    className:
      "bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/20 dark:text-primary",
  },
  overdue: {
    label: "Overdue",
    className:
      "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 dark:bg-chart-4/20 dark:text-chart-4",
  },
  issued: {
    label: "Issued",
    className:
      "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 dark:bg-chart-3/20 dark:text-chart-3",
  },
  viewed: {
    label: "Viewed",
    className:
      "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400",
  },
  draft: {
    label: "Draft",
    className:
      "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/50 dark:text-muted-foreground",
  },
  voided: {
    label: "Voided",
    className:
      "bg-destructive/15 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 dark:bg-chart-2/20 dark:text-chart-2",
  },
  sent: {
    label: "Sent",
    className:
      "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 dark:bg-chart-3/20 dark:text-chart-3",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 dark:bg-chart-4/20 dark:text-chart-4",
  },
  invoiced: {
    label: "Invoiced",
    className:
      "bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/20 dark:text-primary",
  },
  proposal: {
    label: "Proposal",
    className:
      "bg-chart-5/20 text-chart-5 hover:bg-chart-5/30 dark:bg-chart-5/20 dark:text-chart-5",
  },
};

const DOCUMENT_STATUS_OVERRIDES: Partial<
  Record<DocumentType, Partial<Record<string, DocumentStatusStyle>>>
> = {
  advance: {
    issued: {
      label: "Issued",
      className:
        "bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/20 dark:text-primary",
    },
  },
};

const FALLBACK_STATUS_STYLE: DocumentStatusStyle = {
  label: "",
  className:
    "bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground",
};

export function getDocumentStatusStyle(
  uiStatus: string,
  documentType?: DocumentType,
): DocumentStatusStyle {
  if (documentType) {
    const override = DOCUMENT_STATUS_OVERRIDES[documentType]?.[uiStatus];
    if (override) return override;
  }

  const style = DOCUMENT_STATUS_STYLES[uiStatus];
  if (style) return style;

  return {
    ...FALLBACK_STATUS_STYLE,
    label: uiStatus,
  };
}
