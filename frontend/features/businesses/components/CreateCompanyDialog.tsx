"use client";

import type { CreateBusinessDto } from "@/features/businesses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateCompanyForm } from "./CreateCompanyForm";
import { useCreateBusiness, useUploadLogo } from "@/features/businesses";

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCompanyDialogProps) {
  const createBusinessMutation = useCreateBusiness();
  const uploadLogoMutation = useUploadLogo();

  const handleSubmit = async (
    data: CreateBusinessDto,
    logoFile: File | null,
  ) => {
    const business = await createBusinessMutation.mutateAsync(data);
    if (logoFile) {
      await uploadLogoMutation.mutateAsync({
        id: business.id,
        file: logoFile,
      });
    }
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create company</DialogTitle>
          <DialogDescription>
            Add a new company. Set invoice defaults and upload a logo below.
          </DialogDescription>
        </DialogHeader>
        <CreateCompanyForm
          formId="create-company-form"
          logoRequired
          onSubmit={handleSubmit}
        >
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-company-form"
              disabled={
                createBusinessMutation.isPending || uploadLogoMutation.isPending
              }
            >
              {createBusinessMutation.isPending || uploadLogoMutation.isPending
                ? "Creating..."
                : "Create"}
            </Button>
          </DialogFooter>
        </CreateCompanyForm>
      </DialogContent>
    </Dialog>
  );
}
