"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateEstimateDTO } from "@addinvoice/schemas";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { enUS } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface HeaderSectionProps {
  form: UseFormReturn<CreateEstimateDTO>;
  isLoadingNumber: boolean;
}

export function HeaderSection({ form, isLoadingNumber }: HeaderSectionProps) {
  const timelineStartDate = form.watch("timelineStartDate");
  const timelineEndDate = form.watch("timelineEndDate");

  const isIssueDateDisabled = (date: Date) => {
    if (!timelineEndDate) return false;
    return startOfDay(date) > startOfDay(timelineEndDate);
  };

  const isDueDateDisabled = (date: Date) => {
    if (!timelineStartDate) return false;
    return startOfDay(date) < startOfDay(timelineStartDate);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <CardTitle className="text-lg font-bold text-foreground">
          Estimate Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="estimateNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Estimate Number</FieldLabel>
                <Input
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="INV-001"
                  disabled={isLoadingNumber}
                  {...field}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="requireSignature"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="flex items-center gap-2 font-normal cursor-pointer"
                >
                  <Checkbox
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  Ask for signature
                </FieldLabel>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="timelineStartDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Timeline Start Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={field.name}
                      aria-invalid={fieldState.invalid}
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
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      disabled={isIssueDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="timelineEndDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Timeline End Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={field.name}
                      aria-invalid={fieldState.invalid}
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
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => field.onChange(date ?? null)}
                      disabled={isDueDateDisabled}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="purchaseOrder"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Purchase Order (Optional)</FieldLabel>
              <Input
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="PO-12345"
                {...field}
                value={field.value ?? ""}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="summary"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Project Summary (Optional)</FieldLabel>
              <Textarea
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Add a summary of the work to be done..."
                rows={3}
                {...field}
                value={field.value ?? ""}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
