"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CatalogForm,
  type CatalogResponse,
  type CreateCatalogDto,
} from "@/features/catalog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingComponent from "@/components/loading-component";
import { BusinessResponse } from "@/features/businesses";

interface CatalogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: CatalogResponse;
  business?: BusinessResponse | null;
  form: UseFormReturn<CreateCatalogDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingCatalog?: boolean;
  catalogError?: Error | null;
}

export function CatalogFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  business,
  form,
  onSubmit,
  isLoading = false,
  isLoadingCatalog = false,
  catalogError = null,
}: CatalogFormModalProps) {
  const modalTitle =
    mode === "create" ? "Create New Catalog Item" : "Edit Catalog Item";

  // Handle error state - if catalog was not found, show error and close modal
  if (catalogError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={catalogError}
            entityName="Catalog Item"
            url={{ path: "/catalog", displayText: "Back to Catalog" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingCatalog && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 py-4">
              <LoadingComponent variant="form" rows={6} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-4">
            <CatalogForm
              form={form}
              mode={mode}
              initialData={initialData}
              business={business}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
