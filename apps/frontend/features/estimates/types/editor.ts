import type {
  CreateEstimateDescriptiveItemDTO,
  CreateEstimateItemDTO,
} from "@addinvoice/schemas";

export interface EstimateEditorItem {
  uiKey: string;
  persistedItemId?: number;
  data: CreateEstimateItemDTO;
}

export interface EstimateEditorDescriptiveItem {
  uiKey: string;
  persistedItemId?: number;
  data: CreateEstimateDescriptiveItemDTO;
}
