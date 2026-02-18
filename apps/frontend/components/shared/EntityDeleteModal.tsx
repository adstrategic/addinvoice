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
import { AlertTriangle, Trash2 } from "lucide-react";

interface EntityDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entity: string;
  entityName: string;
  isDeleting: boolean;
}

export function EntityDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  entity,
  entityName,
  isDeleting,
}: EntityDeleteModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Delete {entity}</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {entity}{" "}
            <strong>"{entityName}"</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
