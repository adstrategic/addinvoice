"use client";

import { useEffect, useState } from "react";
import { DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateClientDto,
  type UpdateClientDto,
  createClientSchema,
  type ClientResponse,
} from "../schema/clients.schema";
import { useClientActions } from "./useClientActions";
import { useClientBySequence } from "./useClients";
import { useFormErrorHandler } from "@/hooks/useFormErrorHandler";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";

interface UseClientManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useClientManager(options?: UseClientManagerOptions) {
  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [clientSequence, setClientSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  // === DATA FETCHING ===
  const {
    data: existingClient,
    isLoading: isLoadingClient,
    error: clientError,
  } = useClientBySequence(
    clientSequence || 0,
    mode === "edit" && !!clientSequence,
  );

  // === ACCIONES ===
  const actions = useClientActions();

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: DefaultValues<CreateClientDto> = {
    name: "",
    email: "",
    phone: "",
    address: "",
    nit: "",
    businessName: "",
  };

  // Transform validated ClientResponse to form format
  // No need to parse again - service already validated the data
  const getFormValues = (): CreateClientDto | undefined => {
    if (mode === "edit" && existingClient) {
      // existingClient is already validated by the service layer
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

  const form = useForm<CreateClientDto>({
    resolver: zodResolver(createClientSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingClient) {
      form.reset(getFormValues());
    }
  }, [existingClient, mode, form]);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { handleErrorWithToast } = useFormErrorHandler({
    form,
    mode,
    entityName: "client",
  });
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    setMode("create");
    setClientSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setClientSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setClientSequence(null);
  };

  // Envío del formulario
  const processFormData = (data: CreateClientDto) => {
    // En modo edición, solo enviamos campos modificados
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        const apiData = processFormData(data);

        if (mode === "edit") {
          if (!existingClient) throw new Error("No client data loaded");

          await actions.handleUpdate(
            existingClient.id,
            apiData as UpdateClientDto,
          );
        } else {
          await actions.handleCreate(apiData as CreateClientDto);
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

    // Datos del cliente
    client: existingClient,
    isLoadingClient,
    clientError,

    // Formulario
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
