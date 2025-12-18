"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import type { PaymentResponse } from "../../types/api";
import { useDeletePayment } from "../../hooks/usePayments";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentCreateSchema,
  paymentUpdateSchema,
  type PaymentCreateInput,
  type PaymentUpdateInput,
} from "../../schemas/invoice.schema";
import { useCreatePayment, useUpdatePayment } from "../../hooks/usePayments";

interface PaymentsSectionProps {
  invoiceId: number;
  payments: PaymentResponse[];
  invoiceTotal: number;
  onPaymentAdded: () => void;
}

export function PaymentsSection({
  invoiceId,
  payments,
  invoiceTotal,
  onPaymentAdded,
}: PaymentsSectionProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(
    null
  );
  const deletePayment = useDeletePayment();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  const form = useForm<PaymentCreateInput | PaymentUpdateInput>({
    resolver: zodResolver(
      editingPayment ? paymentUpdateSchema : paymentCreateSchema
    ),
    defaultValues: editingPayment
      ? {
          amount: editingPayment.amount,
          paymentMethod: editingPayment.paymentMethod,
          transactionId: editingPayment.transactionId || "",
          paidAt: editingPayment.paidAt.split("T")[0],
          details: editingPayment.details || "",
        }
      : {
          amount: 0,
          paymentMethod: "",
          transactionId: "",
          paidAt: new Date().toISOString().split("T")[0],
          details: "",
        },
  });

  const handleAddPayment = () => {
    setEditingPayment(null);
    form.reset({
      amount: 0,
      paymentMethod: "",
      transactionId: "",
      paidAt: new Date().toISOString().split("T")[0],
      details: "",
    });
    setShowPaymentDialog(true);
  };

  const handleEditPayment = (payment: PaymentResponse) => {
    setEditingPayment(payment);
    form.reset({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || "",
      paidAt: payment.paidAt.split("T")[0],
      details: payment.details || "",
    });
    setShowPaymentDialog(true);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      await deletePayment.mutateAsync(paymentId);
      onPaymentAdded();
    }
  };

  const onSubmit = async (data: PaymentCreateInput | PaymentUpdateInput) => {
    try {
      if (editingPayment) {
        await updatePayment.mutateAsync({
          paymentId: editingPayment.id,
          data: data as PaymentUpdateInput,
        });
      } else {
        await createPayment.mutateAsync({
          invoiceId,
          data: data as PaymentCreateInput,
        });
      }
      setShowPaymentDialog(false);
      setEditingPayment(null);
      form.reset();
      onPaymentAdded();
    } catch (error) {
      // Error handling is done in the hooks
      console.error("Payment save error:", error);
    }
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = invoiceTotal - totalPaid;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">
              Payments
            </CardTitle>
            <Button
              onClick={handleAddPayment}
              size="sm"
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded yet.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground">
                            {formatCurrency(payment.amount)}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {new Date(payment.paidAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Method:
                            </span>{" "}
                            <span className="font-medium">
                              {payment.paymentMethod}
                            </span>
                          </div>
                          {payment.transactionId && (
                            <div>
                              <span className="text-muted-foreground">
                                Transaction ID:
                              </span>{" "}
                              <span className="font-medium">
                                {payment.transactionId}
                              </span>
                            </div>
                          )}
                        </div>
                        {payment.details && (
                          <p className="text-sm text-muted-foreground">
                            {payment.details}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditPayment(payment)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeletePayment(payment.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoiceTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Remaining:</span>
                  <span
                    className={`font-bold ${
                      remaining <= 0 ? "text-green-600" : "text-primary"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Edit Payment" : "Add Payment"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment
                ? "Update the payment information below."
                : "Enter the payment details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="paidAt">Payment Date *</Label>
                <Input id="paidAt" type="date" {...form.register("paidAt")} />
                {form.formState.errors.paidAt && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.paidAt.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.paymentMethod.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                {...form.register("transactionId")}
                placeholder="e.g., TXN-12345"
              />
            </div>

            <div>
              <Label htmlFor="details">Details (Optional)</Label>
              <Textarea
                id="details"
                rows={3}
                {...form.register("details")}
                placeholder="Additional payment details..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setEditingPayment(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : editingPayment
                  ? "Update Payment"
                  : "Add Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
