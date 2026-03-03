"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateCatalogDto,
  type UpdateCatalogDto,
  createCatalogSchema,
} from "../schema/catalog.schema";
import { useCatalogActions } from "./useCatalogActions";
import { useCatalogBySequence } from "./useCatalogs";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

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

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: CreateCatalogDto = {
    name: "",
    description: "",
    price: 0,
    quantityUnit: "UNITS",
    businessId: 0,
  };

  const form = useForm<CreateCatalogDto>({
    resolver: zodResolver(createCatalogSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useCatalogActions(form.setError);

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

  useEffect(() => {
    if (mode === "edit" && existingCatalog) {
      form.reset(getFormValues());
    }
  }, [existingCatalog, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
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

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "edit") {
        if (!existingCatalog) {
          handleMutationError(new Error("No catalog data loaded"));
          return;
        }
        actions.handleUpdate(existingCatalog.id, apiData as UpdateCatalogDto, {
          onSuccess: onSuccessCallback,
        });
      } else {
        actions.handleCreate(apiData as CreateCatalogDto, {
          onSuccess: onSuccessCallback,
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
