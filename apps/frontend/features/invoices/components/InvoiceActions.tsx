import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

interface InvoiceActionsProps {
  onCreateInvoice: () => void;
  onCreateByVoice?: () => void;
}

/**
 * Invoice actions component
 * Header actions for creating invoices
 */
export function InvoiceActions({
  onCreateInvoice,
  onCreateByVoice,
}: InvoiceActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <div className="flex-1 sm:flex-none" data-tour-id="invoices-create-btn">
        <Button
          onClick={onCreateInvoice}
          size="lg"
          className="cursor-pointer gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          Create Invoice
        </Button>
      </div>
    </div>
  );
}
