"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, FileText, User, Building2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePaymentById } from "@/features/payments";

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params?.id ? parseInt(params.id as string) : null;

  const { data: payment, isLoading, error } = usePaymentById(id, id !== null);

  if (isLoading) {
    return (
      <>
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading payment...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !payment) {
    return (
      <>
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <p className="text-muted-foreground">Payment not found</p>
            <Link href="/payments">
              <Button variant="link">Back to payments</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: payment.invoice.currency || "USD",
    }).format(amount);

  return (
    <>
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Payment #{payment.id}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatAmount(payment.amount)} ·{" "}
              {new Date(payment.paidAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {formatAmount(payment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium">{payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid at</p>
                  <p className="font-medium">
                    {new Date(payment.paidAt).toLocaleString()}
                  </p>
                </div>
                {payment.transactionId && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID
                    </p>
                    <p className="font-mono text-sm">{payment.transactionId}</p>
                  </div>
                )}
              </div>
              {payment.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{payment.details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Related invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice number
                  </p>
                  <Link
                    href={`/invoices/${payment.invoice.sequence}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {payment.invoice.invoiceNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {formatAmount(payment.invoice.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-medium">
                    {formatAmount(payment.invoice.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{payment.invoice.status}</p>
                </div>
              </div>
              <Link href={`/invoices/${payment.invoice.sequence}`}>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View invoice
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {payment.invoice.client.name}
                {payment.invoice.client.businessName &&
                  ` (${payment.invoice.client.businessName})`}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.invoice.client.email}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{payment.invoice.business.name}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
