"use client";

import { useEffect } from "react";
import { useForm, Controller, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPaymentSchema,
  type CreatePaymentDto,
} from "@/features/payments/schemas/payments.schema";
import { useCreatePayment } from "../hooks/usePayments";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { NumericFormat } from "react-number-format";
import { Checkbox } from "@/components/ui/checkbox";

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: number;
  invoiceSequence?: number;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceSequence,
}: PaymentFormDialogProps) {
  const createPayment = useCreatePayment();

  const getDefaultValues = (): DefaultValues<CreatePaymentDto> => ({
    paidAt: new Date(),
    sendReceipt: false,
  });

  const defaultValues = getDefaultValues();

  const form = useForm<CreatePaymentDto>({
    resolver: zodResolver(createPaymentSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
    }
  }, [open, form]);

  const onSubmit = async (data: CreatePaymentDto) => {
    if (!invoiceId || !invoiceSequence) {
      throw new Error("Invoice ID and sequence are required");
    }

    await createPayment.mutateAsync({
      invoiceId,
      invoiceSequence,
      data,
    });
    onOpenChange(false);
    form.reset(getDefaultValues());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>
        <form id="payment-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="amount">Amount *</FieldLabel>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.floatValue);
                      }}
                      placeholder="0,00"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      prefix="$"
                      customInput={Input}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="paidAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="paidAt">Payment Date *</FieldLabel>

                    <Popover>
                      <PopoverTrigger asChild>
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
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="paymentMethod">
                    Payment Method *
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="paymentMethod"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="transactionId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transactionId">
                    Transaction ID (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="transactionId"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g., TXN-12345"
                    value={field.value || ""}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="details"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="details">Details (Optional)</FieldLabel>
                  <Textarea
                    {...field}
                    id="details"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                    placeholder="Additional payment details..."
                    value={field.value || ""}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="sendReceipt"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sendReceipt"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor="sendReceipt"
                      className="font-normal cursor-pointer"
                    >
                      Send payment receipt to client
                    </FieldLabel>
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              form.reset(getDefaultValues());
            }}
          >
            Cancel
          </Button>
          <Button
            form="payment-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Add Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
