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
import { transformFromApiFormat } from "../lib/utils";
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
    options?.mode || "create"
  );
  const [invoiceSequence, setInvoiceSequence] = useState<number | null>(
    options?.sequence || null
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

  // Get next invoice number when in create mode and form is open
  const { data: nextInvoiceNumber, isLoading: isLoadingNextNumber } =
    useNextInvoiceNumber(mode === "create" && isFormOpen);

  // === ACCIONES ===
  const actions = useInvoiceActions();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const queryClient = useQueryClient();

  const createItem = useCreateInvoiceItem();

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: DefaultValues<CreateInvoiceDTO> = {
    invoiceNumber: "",
    issueDate: new Date(),
    dueDate: new Date(),
    businessId: existingInvoice?.businessId || 0,
    discount: 0,
    discountType: "NONE",
    taxMode: "NONE",
    currency: "USD",
  };

  const form = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(createInvoiceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
    values:
      mode === "edit" && existingInvoice
        ? transformFromApiFormat(existingInvoice)
        : undefined,
  });

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
  const openCreate = useCallback(() => {
    setMode("create");
    setInvoiceSequence(null);
    form.reset();
    setIsFormOpen(true);
  }, [form, selectedBusiness]);

  const selectBusiness = useCallback(
    (business: BusinessResponse) => {
      setSelectedBusiness(business);
      setShowBusinessDialog(false);
      openCreate();
    },
    [openCreate]
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
    form.reset(); // Limpiar formulario al cerrar
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

      // Get current form values
      const formValues = form.getValues();

      // Validate that client is selected
      if (!formValues.clientId || formValues.clientId <= 0) {
        throw new Error("Client is required before adding products");
      }

      // Validate that business is selected
      if (!selectedBusiness) {
        throw new Error("Business is required before creating invoice");
      }

      const invoiceData: CreateInvoiceDTO = {
        invoiceNumber: formValues.invoiceNumber || "",
        issueDate: formValues.issueDate,
        dueDate: formValues.dueDate,
        clientId: formValues.clientId,
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
    ]
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

        // Always include businessId for create, include it in update if it changed
        if (mode === "create") {
          (apiData as CreateInvoiceDTO).businessId = selectedBusiness.id;
        }

        if (mode === "edit") {
          if (!existingInvoice) throw new Error("No invoice data loaded");

          await actions.handleUpdate(
            existingInvoice.id,
            apiData as UpdateInvoiceDTO
          );
        } else {
          // Create mode: create invoice and navigate to edit page
          const result = await actions.handleCreate(
            apiData as CreateInvoiceDTO
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
      console.log("errors", errors);
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    }
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

    // Formulario
    form,
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
