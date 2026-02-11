"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import type { PaymentResponse } from "../../schemas/invoice.schema";
import { useDeletePayment } from "../../hooks/usePayments";
import { formatCurrency } from "@/lib/utils";
import { PaymentFormDialog } from "../../components/PaymentFormDialog";

interface PaymentsSectionProps {
  invoiceId: number;
  payments: PaymentResponse[];
  invoiceTotal: number;
  invoiceSequence: number;
}

export function PaymentsSection({
  invoiceId,
  payments,
  invoiceTotal,
  invoiceSequence,
}: PaymentsSectionProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const deletePayment = useDeletePayment();

  const handleAddPayment = () => {
    setShowPaymentDialog(true);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      await deletePayment.mutateAsync({ invoiceId, paymentId });
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
                        {/* <Button
                          onClick={() => handleEditPayment(payment)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button> */}
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

      <PaymentFormDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoiceId={invoiceId}
        invoiceSequence={invoiceSequence}
      />
    </>
  );
}
