"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Loader2 } from "lucide-react";
import { useCatalogs } from "@/features/catalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TablePagination } from "@/components/TablePagination";
import { useCreateInvoiceItem } from "../hooks/useInvoiceItems";
import type {
  InvoiceItemResponse,
  InvoiceItemCreateInput,
} from "../schemas/invoice.schema";
import type { CatalogResponse } from "@/features/catalog";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CatalogSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: number | null; // Required to filter catalog items
  invoiceId: number | null; // For adding items
  existingItems: InvoiceItemResponse[]; // To exclude already added items
  taxData: {
    taxMode: "BY_PRODUCT" | "BY_TOTAL" | "NONE";
    taxName: string | null;
    taxPercentage: number | null;
  };
  mode: "create" | "edit";
  onEnsureInvoiceExists?: (data: InvoiceItemCreateInput) => Promise<number>;
  onSuccess: () => void; // Called after item is added
}

export function CatalogSelectionModal({
  open,
  onOpenChange,
  businessId,
  invoiceId,
  existingItems,
  taxData,
  mode,
  onEnsureInvoiceExists,
  onSuccess,
}: CatalogSelectionModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const createItem = useCreateInvoiceItem();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Fetch catalogs with search and pagination
  const {
    data: catalogsData,
    isLoading,
    error,
  } = useCatalogs({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  // Filter catalogs by businessId and exclude already added items
  const availableCatalogs = useMemo(() => {
    if (!catalogsData?.data || !businessId) return [];

    // Get catalog IDs that are already in the invoice
    const existingCatalogIds = existingItems
      .map((item) => item.catalogId)
      .filter((id): id is number => id !== null && id !== undefined);

    // Filter by businessId and exclude already added items
    return catalogsData.data.filter(
      (catalog) =>
        catalog.businessId === businessId &&
        !existingCatalogIds.includes(catalog.id)
    );
  }, [catalogsData?.data, businessId, existingItems]);

  // Map catalog item to invoice item input
  const catalogItemToInvoiceItem = (
    catalog: CatalogResponse
  ): InvoiceItemCreateInput => {
    return {
      name: catalog.name,
      description: catalog.description,
      quantity: 1, // Default quantity
      quantityUnit: catalog.quantityUnit,
      unitPrice: catalog.price,
      discount: 0,
      discountType: "NONE",
      tax: 0, // Will be set based on taxMode
      vatEnabled: false,
      saveToCatalog: false, // Already in catalog, no need to save
      catalogId: catalog.id, // Link to existing catalog
      ...taxData, // Include taxMode, taxName, taxPercentage
    };
  };

  // Handle catalog item selection
  const handleSelectCatalogItem = async (catalog: CatalogResponse) => {
    if (!businessId) {
      toast({
        title: "Business required",
        description: "Please select a business first",
        variant: "destructive",
      });
      return;
    }

    let currentInvoiceId = invoiceId;
    const itemData = catalogItemToInvoiceItem(catalog);

    // If no invoice exists and we're in create mode, create invoice first
    if (!currentInvoiceId && mode === "create" && onEnsureInvoiceExists) {
      setIsCreatingInvoice(true);
      try {
        currentInvoiceId = await onEnsureInvoiceExists(itemData);
        // Navigation will happen in ensureInvoiceExists, so we don't need to do anything else
        return;
      } catch (error) {
        setIsCreatingInvoice(false);

        // If validation failed, close the modal so user can see invoice form errors
        if (error instanceof Error && error.message === "VALIDATION_FAILED") {
          onOpenChange(false);
          return;
        }

        // For other errors, re-throw
        throw error;
      }
    }

    // Validate that we have an invoice ID
    if (!currentInvoiceId) {
      toast({
        title: "Error",
        description: "Invoice ID is required to add a product",
        variant: "destructive",
      });
      return;
    }

    try {
      await createItem.mutateAsync({
        invoiceId: currentInvoiceId,
        data: itemData,
      });

      toast({
        title: "Item added",
        description: `${catalog.name} has been added to the invoice.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to invoice",
        variant: "destructive",
      });
    }
  };

  const quantityUnitLabels = {
    UNITS: "Units",
    HOURS: "Hours",
    DAYS: "Days",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Catalog</DialogTitle>
          <DialogDescription>
            Choose a product or service to add to your invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or services..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>

          {/* Catalog List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">
                  Error loading catalog items. Please try again.
                </p>
              </div>
            ) : availableCatalogs.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No items available
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "No catalog items match your search."
                    : businessId
                    ? "No catalog items found for this business, or all items are already in the invoice."
                    : "Please select a business first."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableCatalogs.map((catalog) => (
                  <div
                    key={catalog.id}
                    onClick={() => handleSelectCatalogItem(catalog)}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent/10 hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">
                            {catalog.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {quantityUnitLabels[catalog.quantityUnit]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {catalog.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(catalog.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {catalogsData?.pagination && availableCatalogs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <TablePagination
                currentPage={currentPage}
                totalPages={catalogsData.pagination.totalPages}
                totalItems={catalogsData.pagination.total}
                onPageChange={setCurrentPage}
                emptyMessage="No catalog items found"
                itemLabel="items"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              router.push("/catalog");
              onOpenChange(false);
            }}
          >
            Manage Catalog
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
