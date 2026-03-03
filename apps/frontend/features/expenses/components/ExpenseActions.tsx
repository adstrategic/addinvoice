import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExpenseActionsProps {
  onOpenCreateModal: () => void;
}

export function ExpenseActions({ onOpenCreateModal }: ExpenseActionsProps) {
  return (
    <div className="flex gap-3 w-full md:w-auto">
      <div data-tour-id="expenses-create-btn">
        <Button onClick={onOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>
    </div>
  );
}
