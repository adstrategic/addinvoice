"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { plainTextFromTipTapJson } from "@/lib/rich-text-plain";
import {
  useCreateEstimateDescriptiveItem,
  useDeleteEstimateDescriptiveItem,
  useUpdateEstimateDescriptiveItem,
} from "../../hooks/useEstimateItems";
import type { EstimateEditorDescriptiveItem } from "../../types/editor";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import type {
  CreateEstimateDescriptiveItemDTO,
} from "@addinvoice/schemas";

interface DescriptiveItemsSectionProps {
  estimateId: number | null;
  mode: "create" | "edit";
  items: EstimateEditorDescriptiveItem[];
  onDraftCreateItem?: (data: CreateEstimateDescriptiveItemDTO) => void;
  onDraftUpdateItem?: (
    uiKey: string,
    data: CreateEstimateDescriptiveItemDTO,
  ) => void;
  onDraftDeleteItem?: (uiKey: string) => void;
}

const emptyDraftItem: CreateEstimateDescriptiveItemDTO = {
  title: "",
  description: null,
};

export function DescriptiveItemsSection({
  estimateId,
  mode,
  items,
  onDraftCreateItem,
  onDraftUpdateItem,
  onDraftDeleteItem,
}: DescriptiveItemsSectionProps) {
  const createItem = useCreateEstimateDescriptiveItem();
  const updateItem = useUpdateEstimateDescriptiveItem();
  const deleteItem = useDeleteEstimateDescriptiveItem();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<EstimateEditorDescriptiveItem | null>(
    null,
  );
  const [draft, setDraft] =
    useState<CreateEstimateDescriptiveItemDTO>(emptyDraftItem);

  const isMutating =
    createItem.isPending || updateItem.isPending || deleteItem.isPending;

  const dialogTitle = useMemo(
    () => (activeItem ? "Edit descriptive item" : "Add descriptive item"),
    [activeItem],
  );

  const handleOpenCreate = () => {
    setActiveItem(null);
    setDraft(emptyDraftItem);
    setIsOpen(true);
  };

  const handleOpenEdit = (item: EstimateEditorDescriptiveItem) => {
    setActiveItem(item);
    setDraft(item.data);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.description) return;

    if (mode === "create") {
      if (activeItem && onDraftUpdateItem) {
        onDraftUpdateItem(activeItem.uiKey, draft);
      } else if (onDraftCreateItem) {
        onDraftCreateItem(draft);
      }
      setIsOpen(false);
      return;
    }

    if (!estimateId) return;

    if (activeItem?.persistedItemId) {
      await updateItem.mutateAsync({
        estimateId,
        descriptiveItemId: activeItem.persistedItemId,
        data: draft,
      });
    } else {
      await createItem.mutateAsync({
        estimateId,
        data: draft,
      });
    }
    setIsOpen(false);
  };

  const handleDelete = async (item: EstimateEditorDescriptiveItem) => {
    if (mode === "create") {
      onDraftDeleteItem?.(item.uiKey);
      return;
    }
    if (!estimateId || !item.persistedItemId) return;
    await deleteItem.mutateAsync({
      estimateId,
      descriptiveItemId: item.persistedItemId,
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Descriptive items
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add proposal details that do not have a price.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            className="gap-2 bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-6 text-sm text-center text-muted-foreground">
            No descriptive items yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.uiKey}
              className="rounded-lg border bg-card/60 p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground">{item.data.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                  {plainTextFromTipTapJson(item.data.description) ||
                    "No description"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(item)}
                  aria-label="Edit descriptive item"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isMutating}
                  onClick={() => void handleDelete(item)}
                  aria-label="Delete descriptive item"
                >
                  {isMutating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={draft.title}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Item title"
              maxLength={255}
            />
            <RichTextEditor
              value={draft.description}
              onChange={(description) =>
                setDraft((prev) => ({ ...prev, description }))
              }
              placeholder="Describe this scope item..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!draft.title.trim() || !draft.description || isMutating}
            >
              {isMutating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
