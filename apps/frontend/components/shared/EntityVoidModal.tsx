"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ban } from "lucide-react";

interface EntityVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entity: string;
  entityName: string;
  isVoiding: boolean;
}

export function EntityVoidModal({
  isOpen,
  onClose,
  onConfirm,
  entity,
  entityName,
  isVoiding,
}: EntityVoidModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Mark {entity} as voided</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to mark the {entity}{" "}
            <strong>&quot;{entityName}&quot;</strong> as voided? This cannot be
            undone. The record will be kept for your records but will no longer
            be active.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isVoiding}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isVoiding}
            className="flex items-center space-x-2"
          >
            <Ban className="h-4 w-4" />
            {isVoiding ? "Voiding..." : "Mark as voided"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
