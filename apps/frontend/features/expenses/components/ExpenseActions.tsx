import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExpenseActionsProps {
  onOpenCreateModal: () => void;
}

export function ExpenseActions({ onOpenCreateModal }: ExpenseActionsProps) {
  return (
    <div className="flex">
      <Button
        onClick={onOpenCreateModal}
        className="gap-2 cursor-pointer flex-1 md:flex-none"
        data-tour-id="expenses-create-btn"
      >
        <Plus className="h-4 w-4" />
        Add Expense
      </Button>
    </div>
  );
}
