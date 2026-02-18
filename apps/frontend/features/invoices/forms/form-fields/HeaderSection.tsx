"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
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
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="INV-001"
                    disabled={isLoadingNumber}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
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
                      disabled={isIssueDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
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
                      disabled={isDueDateDisabled}
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
          name="purchaseOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Order (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="PO-12345"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customHeader"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Header (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add custom header with work details..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
