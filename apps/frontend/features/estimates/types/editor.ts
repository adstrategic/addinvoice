import type { CreateEstimateItemDTO } from "@addinvoice/schemas";

export interface EstimateEditorItem {
  uiKey: string;
  persistedItemId?: number;
  data: CreateEstimateItemDTO;
}
