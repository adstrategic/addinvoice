"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateCatalogDto,
  type UpdateCatalogDto,
  createCatalogSchema,
  type CatalogResponse,
} from "../schema/catalog.schema";
import { useCatalogActions } from "./useCatalogActions";
import { useCatalogBySequence } from "./useCatalogs";
import { useFormErrorHandler } from "@/hooks/useFormErrorHandler";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { useBusiness } from "@/features/businesses";
import type { BusinessResponse } from "@/features/businesses";

interface UseCatalogManagerOptions {
  onAfterSubmit?: () => void;
}

export function useCatalogFormManager(options?: UseCatalogManagerOptions) {
  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [catalogSequence, setCatalogSequence] = useState<number | null>(null);

  // === DATA FETCHING ===
  const {
    data: existingCatalog,
    isLoading: isLoadingCatalog,
    error: catalogError,
  } = useCatalogBySequence(
    catalogSequence || 0,
    mode === "edit" && !!catalogSequence,
  );

  // === ACCIONES ===
  const actions = useCatalogActions();

  // // === BUSINESS FETCHING ===
  // // Fetch business data when editing
  // const {
  //   data: businessData,
  //   isLoading: isLoadingBusiness,
  // } = useBusiness(
  //   existingCatalog?.businessId || null,
  //   mode === "edit" && !!existingCatalog?.businessId
  // );

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: CreateCatalogDto = {
    name: "",
    description: "",
    price: 0,
    quantityUnit: "UNITS",
    businessId: 0,
  };

  // Transform validated CatalogResponse to form format
  // No need to parse again - service already validated the data
  const getFormValues = (): CreateCatalogDto | undefined => {
    if (mode === "edit" && existingCatalog) {
      // existingCatalog is already validated by the service layer
      return {
        name: existingCatalog.name,
        description: existingCatalog.description,
        price: existingCatalog.price,
        quantityUnit: existingCatalog.quantityUnit,
        businessId: existingCatalog.businessId,
      };
    }
    return undefined;
  };

  const form = useForm<CreateCatalogDto>({
    resolver: zodResolver(createCatalogSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingCatalog) {
      form.reset(getFormValues());
    }
  }, [existingCatalog, mode, form]);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { handleErrorWithToast } = useFormErrorHandler({
    form,
    mode,
    entityName: "catalog item",
  });
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    setMode("create");
    setCatalogSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setCatalogSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setCatalogSequence(null);
  };

  // Envío del formulario
  const processFormData = (data: CreateCatalogDto) => {
    // En modo edición, solo enviamos campos modificados
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        const apiData = processFormData(data);

        if (mode === "edit") {
          if (!existingCatalog) throw new Error("No catalog data loaded");

          await actions.handleUpdate(
            existingCatalog.id,
            apiData as UpdateCatalogDto,
          );
        } else {
          await actions.handleCreate(apiData as CreateCatalogDto);
        }

        close(); // Cerrar modal tras éxito
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
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,

    // Datos del catalog
    catalog: existingCatalog,
    isLoadingCatalog,
    catalogError,

    // Business data for form
    business: existingCatalog?.business || null,

    // Formulario
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
