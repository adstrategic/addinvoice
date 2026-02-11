"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type {
  CatalogResponse,
  CreateCatalogDto,
} from "../schema/catalog.schema";
import { BusinessSelector } from "@/components/shared/BusinessSelector";

interface CatalogFormProps {
  form: UseFormReturn<CreateCatalogDto>;
  mode: "create" | "edit";
  initialData?: CatalogResponse;
  business?: { id: number; name: string } | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CatalogForm({
  form,
  mode,
  initialData,
  business,
  onSubmit,
  onCancel,
  isLoading = false,
}: CatalogFormProps) {
  const formTitle =
    mode === "create" ? "Create New Catalog Item" : "Edit Catalog Item";
  const submitButtonText = mode === "create" ? "Create Item" : "Update Item";

  // Get root error for display
  const rootError = form.formState.errors.root;
  const isDirty = form.formState.isDirty;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{formTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Fill in the information below to create a new catalog item."
              : "Update the catalog item information below."}
          </p>
        </div>

        <Separator />

        {/* Root Error */}
        {rootError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Item Information</h3>
            <p className="text-sm text-muted-foreground">
              Essential details for the catalog item.
            </p>
          </div>

          <div className="space-y-4">
            {/* Business Selector */}
            <FormField
              control={form.control}
              name="businessId"
              render={({ field }) => (
                <BusinessSelector
                  field={field}
                  initialBusiness={business || null}
                  mode={mode}
                />
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Web Design Service"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product or service..."
                      disabled={isLoading}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Price <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity Unit */}
              <FormField
                control={form.control}
                name="quantityUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity Unit <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNITS">Units</SelectItem>
                        <SelectItem value="HOURS">Hours</SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
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
            disabled={isLoading}
          >
            {onCancel ? "Cancel" : "Reset"}
          </Button>

          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>

        {/* Form Status Indicator */}
        {mode === "edit" && isDirty && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            * You have unsaved changes
          </div>
        )}
      </form>
    </Form>
  );
}
