"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateInvoiceDTO } from "../../schemas/invoice.schema";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface HeaderSectionProps {
  form: UseFormReturn<CreateInvoiceDTO>;
  isLoadingNumber: boolean;
}

export function HeaderSection({ form, isLoadingNumber }: HeaderSectionProps) {
  const issueDate = form.watch("issueDate");
  const dueDate = form.watch("dueDate");

  const isIssueDateDisabled = (date: Date) => {
    if (!dueDate) return false;
    return startOfDay(date) > startOfDay(dueDate);
  };

  const isDueDateDisabled = (date: Date) => {
    if (!issueDate) return false;
    return startOfDay(date) < startOfDay(issueDate);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">
          Invoice Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="invoiceNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Invoice Number</FieldLabel>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="issueDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Issue Date</FieldLabel>
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
                      selected={field.value}
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
            name="dueDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Due Date</FieldLabel>
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
                      selected={field.value}
                      onSelect={field.onChange}
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
          name="customHeader"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Custom Header (Optional)</FieldLabel>
              <Textarea
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Add custom header with work details..."
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
