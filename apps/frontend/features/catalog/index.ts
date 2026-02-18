/**
 * Catalog Feature Module
 * Central export point for all catalog-related functionality
 *
 * Usage:
 *   import { useCatalogs, CatalogForm, type CatalogResponse } from '@/features/catalog'
 */

// Schemas and Types
export {
  createCatalogSchema,
  updateCatalogSchema,
  catalogResponseSchema,
  catalogResponseListSchema,
  type CreateCatalogDto,
  type UpdateCatalogDto,
  type CatalogResponse,
  type ListCatalogsParams,
} from "./schema/catalog.schema";

// Hooks
export {
  useCatalogs,
  useCatalogBySequence,
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
  catalogKeys,
} from "./hooks/useCatalogs";

export { useCatalogActions } from "./hooks/useCatalogActions";

export { useCatalogFormManager } from "./hooks/useCatalogFormManager";

export { useCatalogDelete } from "./hooks/useCatalogDelete";

// Service
export { catalogService } from "./service/catalog.service";

// Components
export { CatalogCard } from "./components/CatalogCard";
export { CatalogList } from "./components/CatalogList";
export { CatalogFilters } from "./components/CatalogFilters";
export { CatalogActions } from "./components/CatalogActions";
export { default as CatalogContent } from "./components/CatalogContent";

// Forms
export { CatalogForm } from "./forms/CatalogForm";
export { CatalogFormModal } from "./forms/CatalogFormModal";

