"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateClientDto,
  type UpdateClientDto,
  createClientSchema,
} from "../schema/clients.schema";
import { useClientActions } from "./useClientActions";
import { useClientBySequence } from "./useClients";
import { useFormErrorHandler } from "@/hooks/useFormErrorHandler";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { transformFromApiFormat } from "../lib/utils";

interface UseClientManagerOptions {
  onAfterSubmit?: () => void;
}

export function useClientManager(options?: UseClientManagerOptions) {
  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [clientSequence, setClientSequence] = useState<number | null>(null);

  // === DATA FETCHING ===
  const {
    data: existingClient,
    isLoading: isLoadingClient,
    error: clientError,
  } = useClientBySequence(
    clientSequence || 0,
    mode === "edit" && !!clientSequence
  );

  // === ACCIONES ===
  const actions = useClientActions();

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: CreateClientDto = {
    name: "",
    email: "",
    phone: "",
    address: "",
    nit: "",
    businessName: "",
  };

  const form = useForm<CreateClientDto>({
    resolver: zodResolver(createClientSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
    values:
      mode === "edit" && existingClient
        ? transformFromApiFormat(existingClient)
        : undefined,
  });

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
    form.reset();
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
    form.reset(); // Limpiar formulario al cerrar
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
            apiData as UpdateClientDto
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
    }
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
