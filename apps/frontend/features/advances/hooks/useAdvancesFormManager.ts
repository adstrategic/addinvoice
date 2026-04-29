"use client";

import { useCallback, useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createAdvanceSchema,
  type CreateAdvanceDTO,
  type UpdateAdvanceDTO,
  type ClientResponse,
} from "@addinvoice/schemas";
import {
  useAdvanceActions,
  type AdvanceMutationCallbacks,
} from "./useAdvanceActions";
import {
  useAdvanceBySequence,
  useCreateAdvance,
  useSyncAdvanceAttachments,
  useUpdateAdvance,
} from "./useAdvances";
import type { AdvanceImageDraft } from "../types/api";
import { handleMutationError } from "@/lib/errors/handle-error";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { type BusinessResponse } from "@addinvoice/schemas";
import { useBusinesses } from "@/features/businesses";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateClient } from "@/features/clients";
import { clientKeys } from "@/features/clients";

interface UseAdvanceManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useAdvanceManager(options?: UseAdvanceManagerOptions) {
  const router = useRouter();

  // === ESTADO UI ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode || "create",
  );
  const [advanceSequence, setAdvanceSequence] = useState<number | null>(
    options?.sequence || null,
  );

  // === BUSINESS SELECTION ===
  // Fetch businesses from API
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const businesses = businessesData?.data || [];

  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessResponse | null>(null);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [businessPickIntent, setBusinessPickIntent] = useState<
    "form" | "voice" | null
  >(null);
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);
  const [voiceBusiness, setVoiceBusiness] = useState<BusinessResponse | null>(
    null,
  );

  // === DATA FETCHING ===
  const {
    data: existingAdvance,
    isLoading: isLoadingAdvance,
    error: advanceError,
  } = useAdvanceBySequence(advanceSequence || 0, mode === "edit");

  useEffect(() => {
    if (existingAdvance?.business) {
      setSelectedBusiness(existingAdvance.business);
    }
  }, [existingAdvance]);

  const defaultValues: DefaultValues<CreateAdvanceDTO> = {
    advanceDate: new Date(),
    projectName: "",
    createClient: false,
    clientId: 0,
    businessId: 0,
    attachments: [],
    location: "",
  };
  const form = useForm<CreateAdvanceDTO>({
    resolver: zodResolver(createAdvanceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingAdvance) {
      form.reset({
        ...existingAdvance,
        createClient: false,
        clientData: undefined,
      });
    }
  }, [existingAdvance, mode, form]);

  useEffect(() => {
    if (mode === "edit" && existingAdvance?.attachments) {
      setImages(
        existingAdvance.attachments.map((att) => ({
          id: `existing-${att.id}`,
          previewUrl: att.url,
          attachmentId: att.id,
        })),
      );
    }
  }, [existingAdvance, mode]);

  // Update businessId in form when selectedBusiness changes
  useEffect(() => {
    if (selectedBusiness && isFormOpen) {
      form.setValue("businessId", selectedBusiness.id, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [selectedBusiness, isFormOpen, form]);

  // === ACCIONES (after form so we can pass form.setError) ===
  const actions = useAdvanceActions(form.setError);
  const createMutation = useCreateAdvance(form.setError);
  const updateMutation = useUpdateAdvance(form.setError);
  const syncAttachmentsMutation = useSyncAdvanceAttachments();

  const createClientMutation = useCreateClient(form.setError as never);
  const queryClient = useQueryClient();
  const [createdClient, setCreatedClient] = useState<ClientResponse | null>(
    null,
  );
  const [images, setImages] = useState<AdvanceImageDraft[]>([]);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    setMode("create");
    setAdvanceSequence(null);
    setCreatedClient(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const selectBusiness = (
    business: BusinessResponse,
    intentOverride?: "form" | "voice",
  ) => {
    setSelectedBusiness(business);
    setShowBusinessDialog(false);
    const intent = intentOverride ?? businessPickIntent;
    if (intent === "voice") {
      setBusinessPickIntent(null);
      setVoiceBusiness(business);
      setVoicePromptOpen(true);
      return;
    }
    setBusinessPickIntent(null);
    openCreate();
  };

  const handleCreateAdvance = () => {
    setBusinessPickIntent("form");
    if (businesses.length === 1 && businesses[0]) {
      selectBusiness(businesses[0], "form");
      return;
    }

    setShowBusinessDialog(true);
  };

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const drafts: AdvanceImageDraft[] = Array.from(files).map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...drafts]);
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === imageId);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const handleCreateAdvanceByVoice = () => {
    setBusinessPickIntent("voice");
    if (businesses.length === 1 && businesses[0]) {
      selectBusiness(businesses[0], "voice");
      return;
    }
    setShowBusinessDialog(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setAdvanceSequence(sequence);
    setCreatedClient(null);
    setIsFormOpen(true);
  };

  const close = () => {
    images.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setIsFormOpen(false);
    setAdvanceSequence(null);
    setSelectedBusiness(null);
    setCreatedClient(null);
    form.reset(defaultValues);
  };

  const closeVoicePrompt = () => {
    setVoicePromptOpen(false);
    setVoiceBusiness(null);
  };

  const handleBusinessDialogOpenChange = (open: boolean) => {
    setShowBusinessDialog(open);
    if (!open) {
      setBusinessPickIntent(null);
    }
  };

  // Onsubmit: two-step client creation (create client first, then advance/update).
  const onSubmit = form.handleSubmit(
    async (data) => {
      if (!selectedBusiness) {
        handleMutationError(
          new Error("Business must be selected before creating advance"),
          form.setError,
        );
        return;
      }

      const isCreatingNewClient = data.createClient === true && data.clientData;

      if (mode === "create") {
        let clientId: number;
        if (isCreatingNewClient && data.clientData) {
          try {
            const newClient = await createClientMutation.mutateAsync(
              data.clientData,
            );
            clientId = newClient.id;

            // Exit "Create New Client" mode immediately after success
            setCreatedClient(newClient);
            form.setValue("clientId", newClient.id, { shouldDirty: true });
            form.setValue("createClient", false, { shouldDirty: true });
            form.resetField("clientData", { defaultValue: undefined });
            queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
          } catch {
            return;
          }
        } else {
          if (!data.clientId || data.clientId <= 0) {
            handleMutationError(
              new Error("Please select a client or create a new one"),
              form.setError,
            );
            return;
          }
          clientId = data.clientId;
        }

        // Build the payload from the latest form state.
        // We explicitly override `createClient/clientData` because `data` is a
        // snapshot captured by react-hook-form at submit time.
        const latestValues = form.getValues();
        const advancePayload = {
          ...latestValues,
          clientId,
          businessId: selectedBusiness.id,
          createClient: false,
          clientData: undefined,
        };
        try {
          const result = await createMutation.mutateAsync(advancePayload);
          const newFiles = images
            .filter((img) => img.file)
            .map((img) => img.file!);
          if (newFiles.length > 0) {
            await syncAttachmentsMutation.mutateAsync({
              advanceId: result.id,
              keptAttachmentIds: [],
              newFiles,
            });
          }
          if (result?.sequence != null) {
            router.push(`/advances/${result.sequence}/edit`);
          }
          options?.onAfterSubmit?.();
        } catch {
          // errors handled by mutation onError callbacks
        }
        return;
      }

      if (mode === "edit") {
        if (!existingAdvance) {
          handleMutationError(
            new Error("No advance data loaded"),
            form.setError,
          );
          return;
        }

        if (isCreatingNewClient && data.clientData) {
          try {
            const newClient = await createClientMutation.mutateAsync(
              data.clientData,
            );
            setCreatedClient(newClient);
            form.setValue("clientId", newClient.id, { shouldDirty: true });
            form.setValue("createClient", false, { shouldDirty: true });
            form.resetField("clientData", { defaultValue: undefined });
            queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
          } catch {
            return;
          }
        }

        const rawData = form.getValues();
        // `UpdateAdvanceDTO` doesn't include client creation fields, but
        // RHF may still have them in the dirtyValues object depending on UI flow.
        // Strip them before sending to the backend.
        const apiData = getDirtyValues(rawData) as UpdateAdvanceDTO & {
          createClient?: boolean;
          clientData?: unknown;
        };
        delete apiData.createClient;
        delete apiData.clientData;

        const keptAttachmentIds = images
          .filter((img) => img.attachmentId != null)
          .map((img) => img.attachmentId!);
        const newFiles = images.filter((img) => img.file).map((img) => img.file!);
        const existingAttachmentCount = existingAdvance.attachments.length;
        const hasImageChanges =
          newFiles.length > 0 || keptAttachmentIds.length !== existingAttachmentCount;

        if (Object.keys(apiData).length === 0 && !hasImageChanges) {
          options?.onAfterSubmit?.();
          return;
        }

        try {
          if (Object.keys(apiData).length > 0) {
            await updateMutation.mutateAsync({
              id: existingAdvance.id,
              data: apiData as UpdateAdvanceDTO,
            });
          }
          if (hasImageChanges) {
            await syncAttachmentsMutation.mutateAsync({
              advanceId: existingAdvance.id,
              keptAttachmentIds,
              newFiles,
            });
          }
          options?.onAfterSubmit?.();
        } catch {
          // On advance update failure: client (if created) stays selected; user fixes advance and retries.
        }
        return;
      }
    },
    (errors) => {
      console.log(errors);
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  /** Save current form (edit mode only). Resolves when update succeeds. Use before opening send dialog when form is dirty. */
  const saveBeforeSend = useCallback(
    async (callbacks?: AdvanceMutationCallbacks) => {
      const valid = await form.trigger();
      if (!valid) return;
      if (mode !== "edit" || !existingAdvance) {
        throw new Error("Cannot save: not in edit mode or advance not loaded");
      }
      const data = form.getValues();
      const apiData = (
        mode === "edit" ? getDirtyValues(data) : data
      ) as UpdateAdvanceDTO;
      actions.handleUpdate(existingAdvance.id, apiData, {
        onSuccess: () => callbacks?.onSuccess?.(),
      });
    },
    [form, mode, existingAdvance, actions, getDirtyValues],
  );

  /** Save dirty header before opening subforms (e.g. product dialog). Rejects on validation or update failure; scrolls to first error field. */
  const saveBeforeOpenSubform = useCallback(async (): Promise<void> => {
    const valid = await form.trigger();
    if (!valid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) scrollToField(firstErrorField);
      throw new Error("VALIDATION_FAILED");
    }
    if (mode !== "edit" || !existingAdvance) return;
    const data = form.getValues();
    const apiData = getDirtyValues(data) as UpdateAdvanceDTO;
    if (Object.keys(apiData).length === 0) return;
    try {
      await updateMutation.mutateAsync({
        id: existingAdvance.id,
        data: apiData,
      });
    } catch (err) {
      handleMutationError(err, form.setError);
      // const firstField =
      //   err instanceof ApiError &&
      //   err.fields &&
      //   Object.keys(err.fields).length > 0
      //     ? Object.keys(err.fields)[0]
      //     : Object.keys(form.formState.errors)[0];
      // if (firstField) scrollToField(firstField);
      throw err;
    }
  }, [
    form,
    mode,
    existingAdvance,
    getDirtyValues,
    updateMutation,
    scrollToField,
  ]);

  return {
    // Modal Formulario
    isFormOpen,
    mode,
    openCreate,
    openEdit,
    close,

    // Datos del cliente
    advance: existingAdvance,
    isLoadingAdvance,
    advanceError,

    // Formulario
    form,
    isDirty: form.formState.isDirty,
    onSubmit,
    createdClient,
    isMutating:
      actions.isMutating ||
      createMutation.isPending ||
      updateMutation.isPending ||
      syncAttachmentsMutation.isPending,

    // Business Selection
    selectedBusiness,
    showBusinessDialog,
    voicePromptOpen,
    voiceBusiness,
    businesses,
    isLoadingBusinesses,
    selectBusiness,
    setShowBusinessDialog: handleBusinessDialogOpenChange,
    handleCreateAdvance,
    handleCreateAdvanceByVoice,
    closeVoicePrompt,
    hasSelectedBusiness: selectedBusiness !== null,

    // Image handling
    images,
    addImages,
    removeImage,

    // Save before send / before open subform
    saveBeforeSend,
    saveBeforeOpenSubform,
  };
}
