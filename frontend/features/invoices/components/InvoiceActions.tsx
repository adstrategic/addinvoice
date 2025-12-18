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
    <div className="flex gap-2 w-full sm:w-auto">
      <Link href="/invoices/voice" className="flex-1 sm:flex-none">
        <Button
          size="lg"
          variant="outline"
          className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-transparent"
        >
          <Mic className="h-5 w-5" />
          Create by Voice
        </Button>
      </Link>

      <div className="flex-1 sm:flex-none">
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
