"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateClientDto } from "../../schema/clients.schema";
import { NumericFormat } from "react-number-format";

interface ReminderFieldsProps {
  control: Control<CreateClientDto>;
  isLoading?: boolean;
}

export function ReminderFields({
  control,
  isLoading = false,
}: ReminderFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="reminderBeforeDueIntervalDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder before due (days)</FormLabel>
              <FormControl>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="e.g. 3 (every 3 days)"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  customInput={Input}
                  disabled={isLoading}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Leave empty to disable. Send reminder every N days while invoice
                is active (not yet past due).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="reminderAfterDueIntervalDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder after due (days)</FormLabel>
              <FormControl>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  disabled={isLoading}
                  placeholder="e.g. 1 (every day)"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  customInput={Input}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Leave empty to disable. Send reminder every N days when invoice
                is past due.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
