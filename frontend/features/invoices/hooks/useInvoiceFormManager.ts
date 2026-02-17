"use client";

import { useCallback, useEffect, useState } from "react";
import { DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  type CreateInvoiceDTO,
  InvoiceItemCreateInput,
  type UpdateInvoiceDTO,
  createInvoiceSchema,
} from "../schemas/invoice.schema";
import { useInvoiceActions } from "./useInvoiceActions";
import {
  useInvoiceBySequence,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
  invoiceKeys,
} from "./useInvoices";
import { useFormErrorHandler } from "@/hooks/useFormErrorHandler";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { BusinessResponse, useBusinesses } from "@/features/businesses";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateInvoiceItem } from "./useInvoiceItems";

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

  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessResponse | null>(null);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);

  // === DATA FETCHING ===
  const {
    data: existingInvoice,
    isLoading: isLoadingInvoice,
    error: invoiceError,
  } = useInvoiceBySequence(invoiceSequence || 0, mode === "edit");

  useEffect(() => {
    if (existingInvoice) {
      setSelectedBusiness(existingInvoice.business);
    }
  }, [existingInvoice]);

  // Get next invoice number when in create mode, form is open, and a business is selected
  const { data: nextInvoiceNumber, isLoading: isLoadingNextNumber } =
    useNextInvoiceNumber(
      mode === "create" && isFormOpen,
      selectedBusiness?.id ?? null,
    );

  // === ACCIONES ===
  const actions = useInvoiceActions();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const queryClient = useQueryClient();

  const createItem = useCreateInvoiceItem();

  // === CONFIGURACIÓN DEL FORMULARIO ===
  function getDefaultValues(
    business?: BusinessResponse | null,
  ): DefaultValues<CreateInvoiceDTO> {
    const base: DefaultValues<CreateInvoiceDTO> = {
      issueDate: new Date(),
      dueDate: new Date(),
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

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingInvoice) {
      form.reset({
        ...existingInvoice,
        createClient: false,
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

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { handleErrorWithToast } = useFormErrorHandler({
    form,
    mode,
    entityName: "invoice",
  });
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

  const handleCreateInvoice = () => {
    // Auto-select if only one business exists
    if (businesses.length === 1) {
      selectBusiness(businesses[0]);
      return;
    }

    setShowBusinessDialog(true);
  };

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

  // === AUTO-CREATE INVOICE HANDLER ===
  const ensureInvoiceExists = useCallback(
    async (data: InvoiceItemCreateInput): Promise<number> => {
      // If invoice already exists, return its id
      if (existingInvoice?.id) {
        return existingInvoice.id;
      }

      // Trigger form validation - this marks invalid fields with errors in the UI
      const isValid = await form.trigger();
      if (!isValid) {
        // Throw specific error that ProductFormDialog can catch to close modal
        throw new Error("VALIDATION_FAILED");
      }

      // Validate that business is selected
      if (!selectedBusiness) {
        throw new Error("Business is required before creating invoice");
      }

      // Get validated form values
      const formValues = form.getValues();
      const isCreatingNewClient = formValues.createClient === true;

      // Validate client selection based on mode
      if (isCreatingNewClient) {
        if (!formValues.clientData) {
          throw new Error("Client data is required when creating a new client");
        }
      } else {
        if (!formValues.clientId || formValues.clientId <= 0) {
          throw new Error("Client is required before adding products");
        }
      }

      // Build invoice data with conditional client fields
      const invoiceData: CreateInvoiceDTO = {
        invoiceNumber: formValues.invoiceNumber || "",
        issueDate: formValues.issueDate,
        dueDate: formValues.dueDate,
        businessId: selectedBusiness.id,
        currency: formValues.currency || "USD",
        discount: formValues.discount ?? 0,
        discountType: formValues.discountType || "NONE",
        taxMode: formValues.taxMode || "NONE",
        taxName: formValues.taxMode === "BY_TOTAL" ? formValues.taxName : null,
        taxPercentage:
          formValues.taxMode === "BY_TOTAL" ? formValues.taxPercentage : null,
        purchaseOrder: formValues.purchaseOrder,
        customHeader: formValues.customHeader,
        notes: formValues.notes,
        terms: formValues.terms,
        // Conditionally include client fields based on create new client mode
        ...(isCreatingNewClient
          ? {
              createClient: true,
              clientId: formValues.clientId,
              clientData: {
                name: formValues.clientData!.name,
                email: formValues.clientData!.email,
                phone: formValues.clientData!.phone ?? null,
                address: formValues.clientData!.address ?? null,
                nit: formValues.clientData!.nit ?? null,
                businessName: formValues.clientData!.businessName ?? null,
                reminderBeforeDueIntervalDays:
                  formValues.clientData!.reminderBeforeDueIntervalDays ?? null,
                reminderAfterDueIntervalDays:
                  formValues.clientData!.reminderAfterDueIntervalDays ?? null,
              },
            }
          : {
              createClient: false,
              clientId: formValues.clientId,
              clientEmail: formValues.clientEmail || "",
              clientPhone: formValues.clientPhone || null,
              clientAddress: formValues.clientAddress || null,
            }),
      };

      // Create invoice
      const result = await createMutation.mutateAsync(invoiceData);
      const sequence = result.sequence;

      await createItem.mutateAsync({
        invoiceId: result.id,
        data: data as InvoiceItemCreateInput,
      });

      router.push(`/invoices/${sequence}/edit`);
      return result.id;
    },
    [
      form,
      existingInvoice,
      createMutation,
      queryClient,
      router,
      selectedBusiness,
      createItem,
    ],
  );

  // Onsubmit
  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        // Ensure businessId is included
        if (!selectedBusiness) {
          throw new Error("Business must be selected before creating invoice");
        }

        const apiData = processFormData(data);

        // Check if we need to create a new client (from form data)
        const isCreatingNewClient = data.createClient === true;

        if (isCreatingNewClient && mode === "create") {
          // Get client form data from form values
          const clientData = data.clientData;
          if (!clientData) {
            throw new Error(
              "Client data is required when creating a new client",
            );
          }

          // Set createClient flag and include clientData
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

        // Always include businessId for create, include it in update if it changed
        if (mode === "create") {
          (apiData as CreateInvoiceDTO).businessId = selectedBusiness.id;
        }

        if (mode === "edit") {
          if (!existingInvoice) throw new Error("No invoice data loaded");

          await actions.handleUpdate(
            existingInvoice.id,
            apiData as UpdateInvoiceDTO,
          );
        } else {
          // Create mode: create invoice and navigate to edit page
          const result = await actions.handleCreate(
            apiData as CreateInvoiceDTO,
          );

          const sequence = result.sequence;

          // Navigate to edit page
          router.push(`/invoices/${sequence}/edit`);
        }

        options?.onAfterSubmit?.();
      } catch (error) {
        handleErrorWithToast(error);
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

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
    // Auto-create invoice
    ensureInvoiceExists,

    // Business Selection
    selectedBusiness,
    showBusinessDialog,
    businesses,
    isLoadingBusinesses,
    selectBusiness,
    setShowBusinessDialog,
    handleCreateInvoice,
    hasSelectedBusiness: selectedBusiness !== null,
  };
}
