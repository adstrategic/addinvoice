"use client";

import { useEffect, useRef, useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  AlertCircle,
  Scan,
  Camera,
  ImageIcon,
  X,
  CalendarIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UseFormReturn } from "react-hook-form";
import type { ExpenseResponse } from "../schema/expenses.schema";
import type { CreateExpenseDTO } from "@addinvoice/schemas";
import { useReceiptScan } from "../hooks/useReceiptScan";
import {
  MerchantSelector,
  CREATE_NEW_MERCHANT_VALUE,
} from "@/components/shared/MerchantSelector";
import { WorkCategorySelector } from "@/components/shared/WorkCategorySelector";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { NumericFormat } from "react-number-format";

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

interface ExpenseFormProps {
  form: UseFormReturn<CreateExpenseDTO>;
  mode: "create" | "edit";
  initialData?: ExpenseResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading: boolean;
  pendingReceiptFile: File | null;
  onPendingReceiptFileChange: (file: File | null) => void;
}

export function ExpenseForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  pendingReceiptFile,
  onPendingReceiptFileChange,
}: ExpenseFormProps) {
  const initialMerchant = initialData?.merchant ?? null;
  const initialCategory = initialData?.workCategory ?? null;

  const formTitle = mode === "create" ? "Create New Expense" : "Edit Expense";
  const submitButtonText =
    mode === "create" ? "Create Expense" : "Update Expense";

  const rootError = form.formState.errors.root;
  const isDirty = form.formState.isDirty;
  const takePhotoInputRef = useRef<HTMLInputElement>(null);
  const selectPhotoInputRef = useRef<HTMLInputElement>(null);

  const receiptImageUrl = form.watch("image");
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const { scanAndPrefill, isScanningReceipt } = useReceiptScan(form);

  useEffect(() => {
    if (!pendingReceiptFile) {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(pendingReceiptFile);
    setPreviewObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewObjectUrl(null);
    };
  }, [pendingReceiptFile]);

  const handleReceiptFile = (file: File | null) => {
    if (!file) {
      onPendingReceiptFileChange(null);
      return;
    }
    if (
      !file.type.startsWith("image/") ||
      !ALLOWED_IMAGE_TYPES.includes(file.type)
    ) {
      toast.error("Invalid file type", {
        description: "Please select a JPEG, PNG, or WebP image.",
      });
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      toast.error("File too large", {
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }
    onPendingReceiptFileChange(file);
    scanAndPrefill(file);
  };

  const showReceiptPreview = pendingReceiptFile
    ? previewObjectUrl
    : receiptImageUrl || null;

  const handleClearReceipt = () => {
    onPendingReceiptFileChange(null);
    form.setValue("image", "", { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{formTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Fill in the expense details below."
              : "Update the expense information below."}
          </p>
        </div>

        <Separator />

        <div className="flex flex-col items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="gap-2 flex-col h-32 w-32"
                disabled={isLoading || isScanningReceipt}
              >
                <Scan className="size-6" />
                Scan receipt
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => takePhotoInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take photo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => selectPhotoInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Select photo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={takePhotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleReceiptFile(file ?? null);
              e.target.value = "";
            }}
          />
          <input
            ref={selectPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleReceiptFile(file ?? null);
              e.target.value = "";
            }}
          />
          {showReceiptPreview && (
            <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <img
                src={showReceiptPreview}
                alt="Receipt"
                className="h-16 w-16 object-cover rounded border"
              />
              <span className="text-sm text-muted-foreground flex-1 truncate">
                {isScanningReceipt
                  ? "Scanning receipt…"
                  : pendingReceiptFile
                    ? "Receipt image selected (will upload on save)"
                    : "Receipt image attached"}
              </span>
              {isScanningReceipt && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove receipt image"
                onClick={handleClearReceipt}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {rootError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="merchantId"
              render={({ field }) => (
                <MerchantSelector
                  field={{
                    value: field.value,
                    onChange: (v) => field.onChange(v),
                  }}
                  initialMerchant={initialMerchant}
                  mode={mode}
                />
              )}
            />

            {form.watch("merchantId") === CREATE_NEW_MERCHANT_VALUE && (
              <FormField
                control={form.control}
                name="merchantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New merchant name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter merchant name"
                        disabled={isLoading || isScanningReceipt}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expense Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          type="button"
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: enUS })
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="workCategoryId"
            render={({ field }) => (
              <WorkCategorySelector
                field={{
                  value: field.value,
                  onChange: (v) => field.onChange(v),
                }}
                initialCategory={initialCategory}
                mode={mode}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <NumericFormat
                      id="total"
                      value={field.value ?? ""}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? null);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      prefix="$"
                      customInput={Input}
                      disabled={isLoading || isScanningReceipt}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax (optional)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      id="tax"
                      value={field.value ?? ""}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue ?? null);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      prefix="$"
                      customInput={Input}
                      disabled={isLoading || isScanningReceipt}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notes or description"
                    disabled={isLoading || isScanningReceipt}
                    className="resize-none"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                form.reset();
              }
            }}
            disabled={isLoading || isScanningReceipt}
          >
            {onCancel ? "Cancel" : "Reset"}
          </Button>

          <Button
            type="submit"
            disabled={isLoading || isScanningReceipt}
            className="min-w-[120px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>

        {mode === "edit" && isDirty && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            * You have unsaved changes
          </div>
        )}
      </form>
    </Form>
  );
}
