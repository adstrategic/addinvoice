"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Invoice = {
  id: number | string;
  invoiceNumber: string;
  client?: string;
  clientName?: string;
  amount?: number;
  total?: number;
  paidAmount?: number;
  dueDate: string;
  status?: string;
  paymentStatus?: string;
};

type PaymentMethod = {
  id: string;
  type: "credit_card" | "paypal" | "bank_transfer" | "cash" | "other";
  name: string;
  last4?: string;
  isDefault?: boolean;
};

type ReceivePaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onPaymentReceived: () => void;
};

export function ReceivePaymentDialog({
  open,
  onOpenChange,
  invoice,
  onPaymentReceived,
}: ReceivePaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [reference, setReference] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
      const total = invoice.amount || invoice.total || 0;
      const paid = invoice.paidAmount || 0;
      const remaining = total - paid;
      setPaymentAmount(remaining > 0 ? remaining.toString() : total.toString());
      setPaymentDate(new Date());
      setReference("");
    }
  }, [open, invoice]);

  const loadPaymentMethods = () => {
    const methods = JSON.parse(
      localStorage.getItem("paymentMethods") || "[]"
    );
    setPaymentMethods(methods);
    
    // Set default method if available
    const defaultMethod = methods.find((m: PaymentMethod) => m.isDefault);
    if (defaultMethod) {
      setPaymentMethod(defaultMethod.id);
    } else if (methods.length > 0) {
      setPaymentMethod(methods[0].id);
    }
  };

  const handleSubmit = () => {
    const amount = parseFloat(paymentAmount);
    const total = invoice.amount || invoice.total || 0;
    const currentPaid = invoice.paidAmount || 0;

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > total - currentPaid) {
      toast({
        title: "Amount too high",
        description: `Maximum payment amount is $${(total - currentPaid).toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    // Load invoices
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );

    // Find and update invoice
    let found = false;
    const updatedEmitted = emittedInvoices.map((inv: Invoice) => {
      if (inv.id === invoice.id) {
        found = true;
        const newPaidAmount = (inv.paidAmount || 0) + amount;
        const newStatus =
          newPaidAmount >= total
            ? "paid"
            : newPaidAmount > 0
            ? "pending"
            : inv.status;

        return {
          ...inv,
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentStatus:
            newPaidAmount >= total
              ? "paid"
              : newPaidAmount > 0
              ? "partially_paid"
              : "pending",
        };
      }
      return inv;
    });

    const updatedDrafts = draftInvoices.map((inv: Invoice) => {
      if (inv.id === invoice.id) {
        found = true;
        const newPaidAmount = (inv.paidAmount || 0) + amount;
        const newStatus =
          newPaidAmount >= total
            ? "paid"
            : newPaidAmount > 0
            ? "pending"
            : inv.status;

        return {
          ...inv,
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentStatus:
            newPaidAmount >= total
              ? "paid"
              : newPaidAmount > 0
              ? "partially_paid"
              : "pending",
        };
      }
      return inv;
    });

    if (!found) {
      toast({
        title: "Invoice not found",
        description: "Could not find the invoice to update",
        variant: "destructive",
      });
      return;
    }

    // Save payment record
    const payments = JSON.parse(localStorage.getItem("payments") || "[]");
    payments.push({
      id: Date.now().toString(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentMethod,
      paymentDate: paymentDate.toISOString().split("T")[0],
      reference,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("payments", JSON.stringify(payments));

    // Save updated invoices
    localStorage.setItem("emittedInvoices", JSON.stringify(updatedEmitted));
    localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts));

    toast({
      title: "Payment recorded",
      description: `Payment of $${amount.toLocaleString()} has been recorded for ${invoice.invoiceNumber}`,
    });

    onPaymentReceived();
    onOpenChange(false);
  };

  const total = invoice.amount || invoice.total || 0;
  const paid = invoice.paidAmount || 0;
  const remaining = total - paid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Payment</DialogTitle>
          <DialogDescription>
            Record payment for invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice Total:</span>
              <span className="font-semibold text-foreground">
                ${total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-semibold text-foreground">
                ${paid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-semibold text-primary">
                ${remaining.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            {paymentMethods.length > 0 ? (
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {method.name}
                        {method.last4 && ` •••• ${method.last4}`}
                        {method.isDefault && (
                          <span className="text-xs text-muted-foreground">
                            (Default)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border border-border rounded-md">
                No payment methods saved.{" "}
                <a
                  href="/payments/methods"
                  className="text-primary hover:underline"
                >
                  Add one here
                </a>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference number"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!paymentMethod}>
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

