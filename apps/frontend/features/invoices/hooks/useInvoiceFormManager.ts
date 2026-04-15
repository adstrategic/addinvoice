"use client";

import { useCallback, useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  type CreateInvoiceDTO,
  type UpdateInvoiceDTO,
  createInvoiceSchema,
} from "../schemas/invoice.schema";
import { useInvoiceDraftFormState } from "./useInvoiceDraftFormState";
import { mapInvoiceItemsForForm } from "../lib/editor-mappers";
import {
  useInvoiceActions,
  type InvoiceMutationCallbacks,
} from "./useInvoiceActions";
import {
  useInvoiceBySequence,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
} from "./useInvoices";
import { handleMutationError } from "@/lib/errors/handle-error";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { type BusinessResponse } from "@addinvoice/schemas";
import { useBusinesses } from "@/features/businesses";
import { startOfDay } from "date-fns";
import { useWorkspacePaymentMethods } from "@/features/workspace";

interface UseInvoiceManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useInvoiceManager(options?: UseInvoiceManagerOptions) {
  const router = useRouter();

  // === ESTADO UI ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode || "create",
  );
  const [invoiceSequence, setInvoiceSequence] = useState<number | null>(
    options?.sequence || null,
  );

  // === BUSINESS SELECTION ===
  // Fetch businesses from API
  const { data: businessesData, isLoading: isLoadingBusinesses } =
    useBusinesses();
  const businesses = businessesData?.data || [];
  const { data: paymentMethods } = useWorkspacePaymentMethods();
  const defaultPaymentMethodId =
    paymentMethods?.find((method) => method.isDefault)?.id ?? null;

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
    data: existingInvoice,
    isLoading: isLoadingInvoice,
    error: invoiceError,
  } = useInvoiceBySequence(invoiceSequence || 0, mode === "edit");

  useEffect(() => {
    if (existingInvoice?.business) {
      setSelectedBusiness(existingInvoice.business);
    }
  }, [existingInvoice]);

  // Get next invoice number when in create mode, form is open, and a business is selected
  const { data: nextInvoiceNumber, isLoading: isLoadingNextNumber } =
    useNextInvoiceNumber(
      mode === "create" && isFormOpen,
      selectedBusiness?.id ?? null,
    );

  // === CONFIGURACIÓN DEL FORMULARIO ===
  function getDefaultValues(
    business?: BusinessResponse | null,
  ): DefaultValues<CreateInvoiceDTO> {
    const base: DefaultValues<CreateInvoiceDTO> = {
      issueDate: startOfDay(new Date()),
      dueDate: startOfDay(new Date()),
      taxPercentage: null,
      taxName: null,
      discountType: "NONE",
      taxMode: "NONE",
      currency: "USD",
      createClient: false,
      notes: "",
      terms: "",
      discount: 0,
      clientId: 0,
      businessId: business?.id ?? 0,
      invoiceNumber: "",
      selectedPaymentMethodId: defaultPaymentMethodId,
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

  const form = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(createInvoiceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(null),
  });

  const draftFormState = useInvoiceDraftFormState({
    form,
    mode,
    existingInvoice,
  });

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingInvoice) {
      form.reset({
        ...existingInvoice,
        createClient: false,
        items: mapInvoiceItemsForForm(existingInvoice.items),
      });
    }
  }, [existingInvoice, mode, form]);

  // Pre-populate invoice number when next number is available and form is in create mode
  useEffect(() => {
    if (
      mode === "create" &&
      isFormOpen &&
      nextInvoiceNumber &&
      !form.getValues("invoiceNumber")
    ) {
      form.setValue("invoiceNumber", nextInvoiceNumber, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [nextInvoiceNumber, mode, isFormOpen, form]);

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
  const actions = useInvoiceActions(form.setError);
  const createMutation = useCreateInvoice(form.setError);
  const updateMutation = useUpdateInvoice(form.setError);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = useCallback(
    (business?: BusinessResponse | null) => {
      setMode("create");
      setInvoiceSequence(null);
      form.reset(getDefaultValues(business ?? selectedBusiness));
      setIsFormOpen(true);
    },
    [defaultPaymentMethodId, form, selectedBusiness],
  );

  useEffect(() => {
    if (mode !== "create" || !isFormOpen || form.formState.isDirty) return;
    if (form.getValues("selectedPaymentMethodId") != null) return;
    form.setValue("selectedPaymentMethodId", defaultPaymentMethodId, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [defaultPaymentMethodId, form, isFormOpen, mode]);

  const selectBusiness = useCallback(
    (business: BusinessResponse) => {
      setSelectedBusiness(business);
      setShowBusinessDialog(false);
      openCreate(business);
    },
    [openCreate],
  );

  const handleBusinessSelected = useCallback(
    (business: BusinessResponse) => {
      setShowBusinessDialog(false);
      const intent = businessPickIntent;
      setBusinessPickIntent(null);
      if (intent === "voice") {
        setVoiceBusiness(business);
        setVoicePromptOpen(true);
        return;
      }
      selectBusiness(business);
    },
    [businessPickIntent, selectBusiness],
  );

  const setShowBusinessDialogWrapper = useCallback((open: boolean) => {
    setShowBusinessDialog(open);
    if (!open) {
      setBusinessPickIntent(null);
    }
  }, []);

  const handleCreateInvoice = () => {
    if (businesses.length === 1 && businesses[0]) {
      selectBusiness(businesses[0]);
      return;
    }

    setBusinessPickIntent("form");
    setShowBusinessDialog(true);
  };

  const handleCreateInvoiceByVoice = () => {
    if (businesses.length === 1 && businesses[0]) {
      setVoiceBusiness(businesses[0]);
      setVoicePromptOpen(true);
      return;
    }

    setBusinessPickIntent("voice");
    setShowBusinessDialog(true);
  };

  const closeVoicePrompt = useCallback(() => {
    setVoicePromptOpen(false);
    setVoiceBusiness(null);
  }, []);

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setInvoiceSequence(sequence);
    setIsFormOpen(true);
  };

  const close = () => {
    setIsFormOpen(false);
    setInvoiceSequence(null);
    setSelectedBusiness(null);
  };

  // Envío del formulario
  const processFormData = (data: CreateInvoiceDTO) => {
    // En modo edición, solo enviamos campos modificados
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  // Onsubmit
  const onSubmit = form.handleSubmit(
    (data) => {
      if (!selectedBusiness) {
        handleMutationError(
          new Error("Business must be selected before creating invoice"),
          form.setError,
        );
        return;
      }

      if (mode === "create") {
        if (draftFormState.watchedItems.length === 0) {
          form.setError("items", {
            message: "Add at least one item before creating the invoice",
            type: "manual",
          });
          return;
        }
      }

      const apiData = processFormData(data);
      if (mode === "edit" && apiData && typeof apiData === "object") {
        const patch = apiData as Record<string, unknown>;
        delete patch.items;
      }

      // Check if we need to create a new client (from form data)
      const isCreatingNewClient = data.createClient === true;

      if (isCreatingNewClient && mode === "create") {
        const clientData = data.clientData;
        if (!clientData) {
          handleMutationError(
            new Error("Client data is required when creating a new client"),
            form.setError,
          );
          return;
        }

        apiData.createClient = true;
        apiData.clientData = {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone ?? null,
          address: clientData.address ?? null,
          nit: clientData.nit ?? null,
          businessName: clientData.businessName ?? null,
          reminderBeforeDueIntervalDays:
            clientData.reminderBeforeDueIntervalDays ?? null,
          reminderAfterDueIntervalDays:
            clientData.reminderAfterDueIntervalDays ?? null,
        };
      }

      if (mode === "create") {
        const createPayload = {
          ...apiData,
          items: draftFormState.watchedItems,
          businessId: selectedBusiness.id,
        } as CreateInvoiceDTO;
        actions.handleCreate(createPayload, {
          onSuccess: (result) => {
            if (result?.sequence != null) {
              router.push(`/invoices/${result.sequence}/edit`);
            }
            options?.onAfterSubmit?.();
          },
        });
        return;
      }

      if (mode === "edit") {
        if (!existingInvoice) {
          handleMutationError(
            new Error("No invoice data loaded"),
            form.setError,
          );
          return;
        }

        actions.handleUpdate(existingInvoice.id, apiData as UpdateInvoiceDTO, {
          onSuccess: () => options?.onAfterSubmit?.(),
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

  /** Save current form (edit mode only). Resolves when update succeeds. Use before opening send dialog when form is dirty. */
  const saveBeforeSend = useCallback(
    async (callbacks?: InvoiceMutationCallbacks) => {
      const valid = await form.trigger();
      if (!valid) return;
      if (mode !== "edit" || !existingInvoice) {
        throw new Error("Cannot save: not in edit mode or invoice not loaded");
      }
      const data = form.getValues();
      const apiData = (
        mode === "edit" ? getDirtyValues(data) : data
      ) as UpdateInvoiceDTO;
      const patch = { ...apiData } as Record<string, unknown>;
      delete patch.items;
      actions.handleUpdate(existingInvoice.id, patch as UpdateInvoiceDTO, {
        onSuccess: () => callbacks?.onSuccess?.(),
      });
    },
    [form, mode, existingInvoice, actions, getDirtyValues],
  );

  const saveBeforeOpenSubform = useCallback(async (): Promise<void> => {
    const valid = await form.trigger();
    if (!valid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) scrollToField(firstErrorField);
      throw new Error("VALIDATION_FAILED");
    }
    if (mode !== "edit" || !existingInvoice) return;
    const data = form.getValues();
    const apiData = getDirtyValues(data) as UpdateInvoiceDTO;
    const patch = { ...apiData } as Record<string, unknown>;
    delete patch.items;
    if (Object.keys(patch).length === 0) return;
    try {
      await updateMutation.mutateAsync({
        id: existingInvoice.id,
        data: patch as UpdateInvoiceDTO,
      });
    } catch (err) {
      handleMutationError(err, form.setError);
      throw err;
    }
  }, [
    form,
    mode,
    existingInvoice,
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
    invoice: existingInvoice,
    isLoadingInvoice,
    invoiceError,
    isLoadingNextNumber,

    // Formulario
    form,
    isDirty: form.formState.isDirty,
    onSubmit,
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
    handleBusinessSelected,
    setShowBusinessDialog: setShowBusinessDialogWrapper,
    handleCreateInvoice,
    handleCreateInvoiceByVoice,
    hasSelectedBusiness: selectedBusiness !== null,

    // Voice prompt (transcript → API)
    voicePromptOpen,
    voiceBusiness,
    closeVoicePrompt,

    // Save before send / before open subform
    saveBeforeSend,
    saveBeforeOpenSubform,
  };
}
