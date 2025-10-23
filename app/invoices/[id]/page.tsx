"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Send, Edit, Trash2, Printer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { SendInvoiceDialog } from "@/components/send-invoice-dialog"

// Mock invoice data
const invoice = {
  id: "INV-001",
  number: "INV-001",
  status: "pending",
  issueDate: "2025-01-15",
  dueDate: "2025-02-15",
  client: {
    name: "Acme Corp",
    email: "contact@acmecorp.com",
    address: "456 Client Avenue, Business City, BC 12345",
  },
  company: {
    name: "ADSTRATEGIC",
    address: "123 Business St, City, Country",
    nit: "123456789-0",
    email: "contact@adstrategic.com",
    phone: "+1 (555) 123-4567",
  },
  items: [
    { id: "1", description: "Web Design Services", quantity: 1, unitPrice: 2500, tax: 10 },
    { id: "2", description: "SEO Optimization", quantity: 1, unitPrice: 1500, tax: 10 },
    { id: "3", description: "Content Creation", quantity: 3, unitPrice: 500, tax: 10 },
  ],
  notes: "Thank you for your business!",
  terms: "Payment is due within 30 days. Late payments may incur additional fees.",
}

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  pending: { label: "Pending", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
}

export default function InvoiceDetailPage() {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  const calculateItemTotal = (item: (typeof invoice.items)[0]) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const totalTax = invoice.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    return sum + (itemSubtotal * item.tax) / 100
  }, 0)
  const total = subtotal + totalTax

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{invoice.number}</h1>
                <Badge className={statusConfig[invoice.status as keyof typeof statusConfig].className}>
                  {statusConfig[invoice.status as keyof typeof statusConfig].label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">Invoice details and information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-transparent">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-transparent">
              <Download className="h-4 w-4" />
            </Button>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="icon" className="bg-transparent">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => setSendDialogOpen(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/adstrategic-icon.png"
                  alt="ADSTRATEGIC"
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{invoice.company.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{invoice.company.address}</p>
                  <p className="text-sm text-muted-foreground">NIT: {invoice.company.nit}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company.email}</p>
                  <p className="text-sm text-muted-foreground">{invoice.company.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-primary">INVOICE</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold">Invoice #:</span> {invoice.number}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Issue Date:</span> {invoice.issueDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Due Date:</span> {invoice.dueDate}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Bill To */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO:</h4>
              <p className="font-semibold text-foreground">{invoice.client.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Description</th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">Qty</th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">Unit Price</th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">Tax</th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3 text-sm text-foreground">{item.description}</td>
                      <td className="p-3 text-sm text-right text-foreground">{item.quantity}</td>
                      <td className="p-3 text-sm text-right text-foreground">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-sm text-right text-foreground">{item.tax}%</td>
                      <td className="p-3 text-sm text-right font-semibold text-foreground">
                        ${calculateItemTotal(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold text-foreground">${totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {invoice.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Notes:</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {invoice.terms && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Terms & Conditions:</h4>
                <p className="text-sm text-muted-foreground">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoiceId={invoice.id}
        clientName={invoice.client.name}
      />
    </AppLayout>
  )
}
