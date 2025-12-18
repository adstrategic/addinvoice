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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ClientFormData } from "../../schemas/client-form-schema";

interface BusinessTermsFieldsProps {
  control: Control<ClientFormData>;
  isLoading?: boolean;
}

export function BusinessTermsFields({
  control,
  isLoading = false,
}: BusinessTermsFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Días para vencer factura */}
        <FormField
          control={control}
          name="CDiasParaVencerFactura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  min="1"
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recordatorio post vencido */}
        <FormField
          control={control}
          name="CRecordatorioPostVencido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overdue Reminder (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5"
                  min="1"
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cupo autorizado */}
        <FormField
          control={control}
          name="CCupoAutorizado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Limit</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    disabled={isLoading}
                    {...field}
                    onChange={field.onChange}
                    value={field.value}
                    className="pl-7"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Abonos */}
        <FormField
          control={control}
          name="CAbonos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Balance</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    disabled={isLoading}
                    {...field}
                    onChange={field.onChange}
                    value={field.value}
                    className="pl-7"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de ingreso */}
        <FormField
          control={control}
          name="CFechaIngreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                      type="button"
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
