/**
 * Estimates Feature Module
 * Central export point for all estimates-related functionality
 *
 * Usage:
 *   import { useEstimates, EstimateStats, type EstimateResponse } from '@/features/estimates'
 */

// Types - Response types from schema, enums and utilities from types/api
export {
  type EstimateResponseList,
  type EstimateListStatsResponse,
  estimateListStatsSchema,
  estimateResponseListSchema,
} from "./schemas/estimate.schema";

export { mapStatusToUI, mapUIToStatus } from "./types/api";

// Service
export { estimatesService } from "./service/estimates.service";
export type {
  ListEstimatesParams,
  ConvertEstimateToInvoiceResponse,
  ConvertEstimateToInvoiceRequest,
} from "./service/estimates.service";

// Hooks
export {
  useEstimates,
  useEstimateBySequence,
  useEstimatePdfBytes,
  useCreateEstimate,
  useUpdateEstimate,
  useMarkEstimateAsAccepted,
  useDeleteEstimate,
  useConvertEstimateToInvoice,
  estimateKeys,
} from "./hooks/useEstimates";

export {
  useEstimateForAccept,
  useEstimatePdfForAccept,
  useAcceptEstimateByToken,
  useRejectEstimateByToken,
  publicEstimateKeys,
} from "./hooks/usePublicEstimates";

export { PublicEstimateError } from "./service/public-estimates.service";

export { useEstimateActions } from "./hooks/useEstimateActions";
export { useEstimateDelete } from "./hooks/useEstimateDelete";
export {
  useCreateEstimateItem,
  useUpdateEstimateItem,
  useDeleteEstimateItem,
} from "./hooks/useEstimateItems";

// Components
export { default as EstimatesContent } from "./components/EstimatesContent";
export { EstimateStats } from "./components/EstimatesStats";
export { EstimateFilters } from "./components/EstimateFilters";
export { EstimateList } from "./components/EstimatesList";
export { EstimateCard } from "./components/EstimateCard";
export { EstimateActions } from "./components/EstimateActions";
export { EstimateForm } from "./forms/EstimateForm";
export { ProductFormDialog } from "./components/ProductFormDialog";

// Utils
export { calculateItemTotal } from "./lib/utils";
