"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DefaultValues,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createEstimateSchema,
  type CreateEstimateDTO,
  type UpdateEstimateDTO,
  type ClientResponse,
} from "@addinvoice/schemas";
import {
  useEstimateActions,
  type EstimateMutationCallbacks,
} from "./useEstimateActions";
import {
  useEstimateBySequence,
  useCreateEstimate,
  useUpdateEstimate,
  useNextEstimateNumber,
} from "./useEstimates";
import { handleMutationError } from "@/lib/errors/handle-error";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { type BusinessResponse } from "@addinvoice/schemas";
import { useBusinesses } from "@/features/businesses";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateClient } from "@/features/clients";
import { clientKeys } from "@/features/clients";
import { useEstimateDraftFormState } from "./useEstimateDraftFormState";
interface UseEstimateManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useEstimateManager(options?: UseEstimateManagerOptions) {
  const router = useRouter();

  // === ESTADO UI ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode || "create",
  );
  const [estimateSequence, setEstimateSequence] = useState<number | null>(
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

  // === DATA FETCHING ===
  const {
    data: existingEstimate,
    isLoading: isLoadingEstimate,
    error: estimateError,
  } = useEstimateBySequence(estimateSequence || 0, mode === "edit");

  useEffect(() => {
    if (existingEstimate?.business) {
      setSelectedBusiness(existingEstimate.business);
    }
  }, [existingEstimate]);

  // Get next estimate number when in create mode, form is open, and a business is selected
  const { data: nextEstimateNumber, isLoading: isLoadingNextNumber } =
    useNextEstimateNumber(
      mode === "create" && isFormOpen,
      selectedBusiness?.id ?? null,
    );

  // === CONFIGURACIÓN DEL FORMULARIO ===
  function getDefaultValues(
    business?: BusinessResponse | null,
  ): DefaultValues<CreateEstimateDTO> {
    const base: DefaultValues<CreateEstimateDTO> = {
      taxPercentage: null,
      taxName: null,
      discountType: "NONE",
      taxMode: "NONE",
      currency: "USD",
      notes: "",
      terms: "",
      discount: 0,
      clientId: 0,
      businessId: business?.id ?? 0,
      estimateNumber: "",
      createClient: false,
      items: [],
    };
    if (!business) return base;
    return {
      ...base,
      businessId: business.id,
      taxMode:
        business.defaultTaxMode === "NONE" ||
        business.defaultTaxMode === "BY_PRODUCT" ||
        business.defaultTaxMode === "BY_TOTAL"
          ? business.defaultTaxMode
          : "NONE",
      taxName: business.defaultTaxName ?? null,
      taxPercentage:
        business.defaultTaxPercentage != null
          ? Number(business.defaultTaxPercentage)
          : null,
      notes: business.defaultNotes ?? "",
      terms: business.defaultTerms ?? "",
    };
  }

  const form = useForm<CreateEstimateDTO>({
    resolver: zodResolver(createEstimateSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(null),
  });
  const draftFormState = useEstimateDraftFormState({
    form,
    mode,
    existingEstimate,
  });

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingEstimate) {
      form.reset({
        ...existingEstimate,
        createClient: false,
      });
    }
  }, [existingEstimate, mode, form]);

  // Pre-populate estimate number when next number is available and form is in create mode
  useEffect(() => {
    if (
      mode === "create" &&
      isFormOpen &&
      nextEstimateNumber &&
      !form.getValues("estimateNumber")
    ) {
      form.setValue("estimateNumber", nextEstimateNumber, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [nextEstimateNumber, mode, isFormOpen, form]);

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
  const actions = useEstimateActions(form.setError);
  const createMutation = useCreateEstimate(form.setError);
  const updateMutation = useUpdateEstimate(form.setError);

  const createClientMutation = useCreateClient(form.setError as never);
  const queryClient = useQueryClient();
  const [createdClient, setCreatedClient] = useState<ClientResponse | null>(
    null,
  );

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = useCallback(
    (business?: BusinessResponse | null) => {
      setMode("create");
      setEstimateSequence(null);
      setCreatedClient(null);
      form.reset(getDefaultValues(business ?? selectedBusiness));
      setIsFormOpen(true);
    },
    [form, selectedBusiness],
  );

  const selectBusiness = useCallback(
    (business: BusinessResponse) => {
      setSelectedBusiness(business);
      setShowBusinessDialog(false);
      openCreate(business);
    },
    [openCreate],
  );

  const handleCreateEstimate = () => {
    if (businesses.length === 1 && businesses[0]) {
      selectBusiness(businesses[0]);
      return;
    }

    setShowBusinessDialog(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setEstimateSequence(sequence);
    setCreatedClient(null);
    setIsFormOpen(true);
  };

  const close = () => {
    setIsFormOpen(false);
    setEstimateSequence(null);
    setSelectedBusiness(null);
    setCreatedClient(null);
  };

  // Onsubmit: two-step client creation (create client first, then estimate/update).
  const onSubmit = form.handleSubmit(
    async (data) => {
      if (!selectedBusiness) {
        handleMutationError(
          new Error("Business must be selected before creating estimate"),
          form.setError,
        );
        return;
      }

      const isCreatingNewClient = data.createClient === true && data.clientData;

      if (mode === "create") {
        if (draftFormState.watchedItems.length === 0) {
          form.setError("items", {
            message: "Add at least one item before creating the estimate",
            type: "manual",
          });
          return;
        }

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

        const estimatePayload = {
          ...data,
          items: draftFormState.watchedItems,
          clientId,
          businessId: selectedBusiness.id,
        };
        actions.handleCreate(estimatePayload, {
          onSuccess: (result) => {
            if (result?.sequence != null) {
              router.push(`/estimates/${result.sequence}/edit`);
            }
            options?.onAfterSubmit?.();
          },
        });
        return;
      }

      if (mode === "edit") {
        if (!existingEstimate) {
          handleMutationError(
            new Error("No estimate data loaded"),
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
        const apiData = getDirtyValues(rawData) as UpdateEstimateDTO;
        delete apiData.createClient;
        delete apiData.clientData;

        if (Object.keys(apiData).length === 0) {
          options?.onAfterSubmit?.();
          return;
        }

        try {
          await updateMutation.mutateAsync({
            id: existingEstimate.id,
            data: apiData as UpdateEstimateDTO,
          });
          options?.onAfterSubmit?.();
        } catch {
          // On estimate update failure: client (if created) stays selected; user fixes estimate and retries.
        }
        return;
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  /** Save current form (edit mode only). Resolves when update succeeds. Use before opening send dialog when form is dirty. */
  const saveBeforeSend = useCallback(
    async (callbacks?: EstimateMutationCallbacks) => {
      const valid = await form.trigger();
      if (!valid) return;
      if (mode !== "edit" || !existingEstimate) {
        throw new Error("Cannot save: not in edit mode or estimate not loaded");
      }
      const data = form.getValues();
      const apiData = (
        mode === "edit" ? getDirtyValues(data) : data
      ) as UpdateEstimateDTO;
      actions.handleUpdate(existingEstimate.id, apiData, {
        onSuccess: () => callbacks?.onSuccess?.(),
      });
    },
    [form, mode, existingEstimate, actions, getDirtyValues],
  );

  /** Save dirty header before opening subforms (e.g. product dialog). Rejects on validation or update failure; scrolls to first error field. */
  const saveBeforeOpenSubform = useCallback(async (): Promise<void> => {
    const valid = await form.trigger();
    if (!valid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) scrollToField(firstErrorField);
      throw new Error("VALIDATION_FAILED");
    }
    if (mode !== "edit" || !existingEstimate) return;
    const data = form.getValues();
    const apiData = getDirtyValues(data) as UpdateEstimateDTO;
    if (Object.keys(apiData).length === 0) return;
    try {
      await updateMutation.mutateAsync({
        id: existingEstimate.id,
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
    existingEstimate,
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
    estimate: existingEstimate,
    isLoadingEstimate,
    estimateError,
    isLoadingNextNumber,

    // Formulario
    form,
    isDirty: form.formState.isDirty,
    onSubmit,
    createdClient,
    isMutating:
      actions.isMutating ||
      createMutation.isPending ||
      updateMutation.isPending,
    draftItems: draftFormState.editorItems,
    draftTotals: draftFormState.draftTotals,
    addDraftItem: draftFormState.appendItem,
    updateDraftItem: draftFormState.updateItemByUiKey,
    removeDraftItem: draftFormState.removeItemByUiKey,
    replaceDraftItems: draftFormState.replaceItems,

    // Business Selection
    selectedBusiness,
    showBusinessDialog,
    businesses,
    isLoadingBusinesses,
    selectBusiness,
    setShowBusinessDialog,
    handleCreateEstimate,
    hasSelectedBusiness: selectedBusiness !== null,

    // Save before send / before open subform
    saveBeforeSend,
    saveBeforeOpenSubform,

    // Convert to invoice (accepted estimates only)
    onConvertToInvoice: actions.handleConvertToInvoice,
    isConvertingToInvoice: actions.isConvertingToInvoice,
  };
}
