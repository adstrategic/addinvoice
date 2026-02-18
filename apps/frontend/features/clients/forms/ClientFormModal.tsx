"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClientForm,
  type ClientResponse,
  type CreateClientDto,
} from "@/features/clients";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingComponent from "@/components/loading-component";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: ClientResponse;
  form: UseFormReturn<CreateClientDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingClient?: boolean;
  clientError?: Error | null;
}

export function ClientFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingClient = false,
  clientError = null,
}: ClientFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Client" : "Edit Client";

  // Handle error state - if client was not found, show error and close modal
  if (clientError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={clientError}
            entityName="Client"
            url={{ path: "/clients", displayText: "Back to Clients" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingClient && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 py-4">
              <LoadingComponent variant="form" rows={8} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl! max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-4">
            <ClientForm
              form={form}
              mode={mode}
              initialData={initialData}
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
