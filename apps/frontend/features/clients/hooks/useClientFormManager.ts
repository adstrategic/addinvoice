"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateClientDTO,
  type UpdateClientDTO,
  createClientSchema,
} from "@addinvoice/schemas";
import { toast } from "sonner";
import { useClientActions } from "./useClientActions";
import { useClientBySequence, useUploadClientLogo } from "./useClients";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseClientManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useClientManager(options?: UseClientManagerOptions) {
  // === UI STATE ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [clientSequence, setClientSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  // === LOGO STATE ===
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // === DATA FETCHING ===
  const {
    data: existingClient,
    isLoading: isLoadingClient,
    error: clientError,
  } = useClientBySequence(
    clientSequence || 0,
    mode === "edit" && !!clientSequence,
  );

  const defaultValues: DefaultValues<CreateClientDTO> = {
    name: "",
    email: "",
    phone: "",
    address: "",
    nit: "",
    businessName: "",
  };

  const form = useForm<CreateClientDTO>({
    resolver: zodResolver(createClientSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useClientActions(form.setError);
  const uploadLogoMutation = useUploadClientLogo();

  const getFormValues = (): CreateClientDTO | undefined => {
    if (mode === "edit" && existingClient) {
      return {
        name: existingClient.name,
        email: existingClient.email,
        phone: existingClient.phone || "",
        address: existingClient.address || "",
        nit: existingClient.nit || "",
        businessName: existingClient.businessName || "",
        reminderBeforeDueIntervalDays:
          existingClient.reminderBeforeDueIntervalDays,
        reminderAfterDueIntervalDays:
          existingClient.reminderAfterDueIntervalDays,
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingClient) {
      form.reset(getFormValues());
    }
  }, [existingClient, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === LOGO HANDLERS ===

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 5MB",
      });
      return;
    }
    setSelectedLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // === FORM HANDLERS ===

  const openCreate = () => {
    setMode("create");
    setClientSequence(null);
    setSelectedLogoFile(null);
    setLogoPreview(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setClientSequence(sequence);
    setSelectedLogoFile(null);
    setLogoPreview(null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const processFormData = (data: CreateClientDTO) => {
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "edit") {
        if (!existingClient) {
          handleMutationError(new Error("No client data loaded"));
          return;
        }
        actions.handleUpdate(existingClient.id, apiData as UpdateClientDTO, {
          onSuccess: () => {
            if (selectedLogoFile) {
              uploadLogoMutation.mutate(
                { id: existingClient.id, file: selectedLogoFile },
                { onSuccess: onSuccessCallback },
              );
            } else {
              onSuccessCallback();
            }
          },
        });
      } else {
        actions.handleCreate(apiData as CreateClientDTO, {
          onSuccess: (createdClient) => {
            if (selectedLogoFile && createdClient) {
              uploadLogoMutation.mutate(
                { id: createdClient.id, file: selectedLogoFile },
                { onSuccess: onSuccessCallback },
              );
            } else {
              onSuccessCallback();
            }
          },
        });
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  // Display URL: local preview takes priority over the server logo
  const logoDisplayUrl =
    logoPreview ?? (mode === "edit" ? (existingClient?.logo ?? null) : null);

  return {
    // Modal
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,

    // Client data
    client: existingClient,
    isLoadingClient,
    clientError,

    // Form
    form,
    onSubmit,
    isMutating: actions.isMutating || uploadLogoMutation.isPending,

    // Logo
    logoDisplayUrl,
    selectedLogoFile,
    handleLogoSelect,
    isUploadingLogo: uploadLogoMutation.isPending,
  };
}
