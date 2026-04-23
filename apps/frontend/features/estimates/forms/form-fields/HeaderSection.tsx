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
          <FormField
            control={form.control}
            name="estimateNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimate Number</FormLabel>
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
          <FormField
            control={form.control}
            name="requireSignature"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal cursor-pointer">
                    Ask for signature
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="timelineStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline Start Date</FormLabel>
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
                      selected={field.value ?? undefined}
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
            name="timelineEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline End Date</FormLabel>
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
                      selected={field.value ?? undefined}
                      onSelect={(date) => field.onChange(date ?? null)}
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
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Summary (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a summary of the work to be done..."
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
