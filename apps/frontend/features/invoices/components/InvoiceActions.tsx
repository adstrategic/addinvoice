import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";

interface InvoiceActionsProps {
  onCreateInvoice: () => void;
  onCreateByVoice: () => void;
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
      <Button
        type="button"
        variant="outline"
        className="gap-2 flex-1 md:flex-none cursor-pointer"
        onClick={onCreateByVoice}
      >
        <Mic className="h-4 w-4" />
        Add by voice
      </Button>
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
