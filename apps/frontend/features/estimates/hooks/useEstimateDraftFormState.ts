"use client";

import { useMemo } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import type { CreateEstimateDTO, CreateEstimateItemDTO, EstimateResponse } from "@addinvoice/schemas";
import { calculateDraftEstimateTotals } from "../lib/utils";
import { mapFieldArrayToEditorItems } from "../lib/editor-mappers";

export function useEstimateDraftFormState(params: {
  form: UseFormReturn<CreateEstimateDTO>;
  mode: "create" | "edit";
  existingEstimate?: EstimateResponse | null;
}) {
  const { form, mode, existingEstimate } = params;

  const {
    fields: fieldItems,
    append,
    remove,
    replace,
    update,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const draftDiscount = useWatch({ control: form.control, name: "discount" }) || 0;
  const draftDiscountType =
    useWatch({ control: form.control, name: "discountType" }) || "NONE";
  const draftTaxMode = useWatch({ control: form.control, name: "taxMode" }) || "NONE";
  const draftTaxPercentage =
    useWatch({ control: form.control, name: "taxPercentage" }) || null;
  const watchedItemsValue = useWatch({ control: form.control, name: "items" });
  const watchedItems = useMemo(() => watchedItemsValue ?? [], [watchedItemsValue]);

  const editorItems = useMemo(
    () =>
      mapFieldArrayToEditorItems(
        fieldItems,
        watchedItems,
        mode === "edit" ? existingEstimate?.items : undefined,
      ),
    [fieldItems, watchedItems, mode, existingEstimate?.items],
  );

  const draftTotals = useMemo(
    () =>
      mode === "create"
        ? calculateDraftEstimateTotals(
            {
              discount: draftDiscount,
              discountType: draftDiscountType,
              taxMode: draftTaxMode,
              taxPercentage: draftTaxPercentage,
            },
            watchedItems,
          )
        : null,
    [
      mode,
      draftDiscount,
      draftDiscountType,
      draftTaxMode,
      draftTaxPercentage,
      watchedItems,
    ],
  );

  const updateItemByUiKey = (uiKey: string, itemData: CreateEstimateItemDTO) => {
    const itemIndex = fieldItems.findIndex((item) => item.id === uiKey);
    if (itemIndex >= 0) update(itemIndex, itemData);
  };

  const removeItemByUiKey = (uiKey: string) => {
    const itemIndex = fieldItems.findIndex((item) => item.id === uiKey);
    if (itemIndex >= 0) remove(itemIndex);
  };

  return {
    watchedItems,
    editorItems,
    draftTotals,
    appendItem: append,
    updateItemByUiKey,
    removeItemByUiKey,
    replaceItems: replace,
  };
}
