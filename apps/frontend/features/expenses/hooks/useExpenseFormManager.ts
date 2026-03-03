"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateExpenseDTO,
  type UpdateExpenseDTO,
  createExpenseSchema,
} from "@addinvoice/schemas";
import { expensesService } from "../service/expenses.service";
import { useExpenseActions } from "./useExpenseActions";
import { useExpenseBySequence } from "./useExpenses";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseExpenseManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useExpenseManager(options?: UseExpenseManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [expenseSequence, setExpenseSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );
  const [pendingReceiptFile, setPendingReceiptFile] = useState<File | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: existingExpense,
    isLoading: isLoadingExpense,
    error: expenseError,
  } = useExpenseBySequence(
    expenseSequence ?? 0,
    mode === "edit" && !!expenseSequence,
  );

  const defaultValues: DefaultValues<CreateExpenseDTO> = {
    expenseDate: new Date(),
    merchantId: null,
    workCategoryId: null,
    merchantName: undefined,
    total: 1,
    tax: undefined,
    description: "",
    image: "",
  };

  const form = useForm<CreateExpenseDTO>({
    resolver: zodResolver(createExpenseSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useExpenseActions(form.setError);

  const getFormValues = (): CreateExpenseDTO | undefined => {
    if (mode === "edit" && existingExpense) {
      return {
        expenseDate: new Date(existingExpense.expenseDate),
        merchantId: existingExpense.merchantId ?? null,
        merchantName: null,
        workCategoryId: existingExpense.workCategoryId ?? null,
        total: Number(existingExpense.total),
        tax: existingExpense.tax != null ? Number(existingExpense.tax) : null,
        description: existingExpense.description,
        image: existingExpense.image,
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingExpense) {
      form.reset(getFormValues());
    }
  }, [existingExpense, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setExpenseSequence(null);
    setPendingReceiptFile(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setExpenseSequence(sequence);
    setPendingReceiptFile(null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setPendingReceiptFile(null);
  };

  const processFormData = (data: CreateExpenseDTO) => {
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    async (data) => {
      setIsSubmitting(true);
      try {
        const payload = processFormData(data);

        if (mode === "edit") {
          if (!existingExpense) {
            handleMutationError(new Error("No expense data loaded"));
            return;
          }
          let finalPayload: UpdateExpenseDTO = payload as UpdateExpenseDTO;
          if (pendingReceiptFile) {
            try {
              const url =
                await expensesService.uploadReceipt(pendingReceiptFile);
              finalPayload = { ...finalPayload, image: url };
            } catch (err) {
              handleMutationError(
                err instanceof Error ? err : new Error(String(err)),
              );
              return;
            }
          }
          await actions.handleUpdateAsync(
            existingExpense.id,
            existingExpense.sequence,
            finalPayload,
          );
          onSuccessCallback();
          return;
        }

        let createPayload: CreateExpenseDTO = payload as CreateExpenseDTO;
        if (pendingReceiptFile) {
          try {
            const url = await expensesService.uploadReceipt(pendingReceiptFile);
            createPayload = { ...createPayload, image: url };
          } catch (err) {
            handleMutationError(
              err instanceof Error ? err : new Error(String(err)),
            );
            return;
          }
        }
        await actions.handleCreateAsync(createPayload);
        onSuccessCallback();
      } catch {
        // Error handling is done in mutation onError (handleMutationError)
      } finally {
        setIsSubmitting(false);
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
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,
    expense: existingExpense,
    isLoadingExpense,
    expenseError,
    form,
    onSubmit,
    isMutating: isSubmitting || actions.isMutating,
    pendingReceiptFile,
    setPendingReceiptFile,
  };
}
