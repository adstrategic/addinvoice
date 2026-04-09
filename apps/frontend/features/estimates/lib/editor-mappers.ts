import type { FieldArrayWithId } from "react-hook-form";
import type { CreateEstimateDTO, EstimateResponse } from "@addinvoice/schemas";
import type { EstimateEditorItem } from "../types/editor";

export function mapFieldArrayToEditorItems(
  fieldItems: FieldArrayWithId<CreateEstimateDTO, "items", "id">[],
  watchedItems: CreateEstimateDTO["items"] | undefined,
  persistedItems?: EstimateResponse["items"],
): EstimateEditorItem[] {
  const items = watchedItems ?? [];
  const editorItems: EstimateEditorItem[] = [];

  fieldItems.forEach((fieldItem, index) => {
    const itemData = items[index];
    if (!itemData) return;

    editorItems.push({
      uiKey: fieldItem.id,
      persistedItemId: persistedItems?.[index]?.id,
      data: itemData,
    });
  });

  return editorItems;
}
