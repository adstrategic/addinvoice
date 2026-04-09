import type { FieldArrayWithId } from "react-hook-form";
import type {
  CreateInvoiceDTO,
  InvoiceItemCreateInput,
  InvoiceItemResponse,
  InvoiceResponse,
} from "../schemas/invoice.schema";
import type { InvoiceEditorItem } from "../types/editor";

export function mapInvoiceItemsForForm(
  items: InvoiceItemResponse[] | undefined,
): InvoiceItemCreateInput[] {
  return (items ?? []).map((item) => ({
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    unitPrice: item.unitPrice,
    discount: item.discount,
    discountType: item.discountType,
    tax: item.tax,
    vatEnabled: item.vatEnabled,
    saveToCatalog: false,
    catalogId: item.catalogId,
    taxName: null,
    taxPercentage: null,
  }));
}

export function mapFieldArrayToEditorItems(
  fieldItems: FieldArrayWithId<CreateInvoiceDTO, "items", "id">[],
  watchedItems: CreateInvoiceDTO["items"] | undefined,
  persistedItems?: InvoiceResponse["items"],
): InvoiceEditorItem[] {
  const items = watchedItems ?? [];
  const editorItems: InvoiceEditorItem[] = [];

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
