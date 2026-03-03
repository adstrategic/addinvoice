import { useState, useCallback, useEffect } from "react";
import { useWorkCategories } from "@/features/work-categories";
import type { WorkCategoryResponse } from "@/features/work-categories";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useWorkCategorySelector = (
  initialCategory: WorkCategoryResponse | null,
  mode: "create" | "edit",
) => {
  const [openCategories, setOpenCategories] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState(
    initialCategory?.name || "",
  );
  const [selectedCategory, setSelectedCategory] =
    useState<WorkCategoryResponse | null>(initialCategory || null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setCategoryQuery(initialCategory.name);
    }
  }, [initialCategory]);

  const debouncedQuery = useDebouncedValue(categoryQuery, 300);

  const {
    data: categoriesData,
    isFetching: loadingCategories,
    isFetched,
  } = useWorkCategories({
    search: debouncedQuery,
  });

  const categories =
    mode === "edit" && !hasUserInteracted
      ? initialCategory
        ? [initialCategory]
        : [...(categoriesData?.data ?? [])]
      : categoriesData?.data ?? [];

  const handleCategorySearch = useCallback((query: string) => {
    setCategoryQuery(query);
    setHasUserInteracted((prev) => (prev ? prev : true));
  }, []);

  const toggleCategoryPopover = useCallback(
    (open: boolean) => {
      setOpenCategories(open);
      if (!open) {
        setCategoryQuery(selectedCategory?.name || "");
      }
    },
    [selectedCategory],
  );

  const handleCategorySelect = useCallback(
    (category: WorkCategoryResponse) => {
      setSelectedCategory(category);
      setOpenCategories(false);
      setCategoryQuery(category.name);
    },
    [],
  );

  const handleSelectNone = useCallback(() => {
    setSelectedCategory(null);
    setOpenCategories(false);
    setCategoryQuery("");
  }, []);

  return {
    categoryQuery,
    openCategories,
    categories,
    loadingCategories,
    isFetched,
    hasUserInteracted,
    selectedCategory,
    handleCategorySearch,
    handleCategorySelect,
    toggleCategoryPopover,
    handleSelectNone,
  };
};
