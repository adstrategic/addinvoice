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
    <div className="flex gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="gap-2 cursor-pointer flex-1 md:flex-none"
        onClick={onCreateByVoice}
        data-tour-id="invoices-voice-btn"
      >
        <Mic className="h-5 w-5" />
        Add by voice
      </Button>
      <Button
        type="button"
        onClick={onCreateInvoice}
        size="lg"
        className="cursor-pointer flex-1 md:flex-none gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        data-tour-id="invoices-create-btn"
      >
        <Plus className="h-5 w-5" />
        Create Invoice
      </Button>
    </div>
  );
}
