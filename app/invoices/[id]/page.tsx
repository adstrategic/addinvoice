"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Send, Edit, Trash2, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SendInvoiceDialog } from "@/components/send-invoice-dialog";
import { useToast } from "@/hooks/use-toast";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
};

type Invoice = {
  id: number | string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientPhone?: string;
  companyName: string;
  companyAddress: string;
  companyNIT: string;
  companyEmail: string;
  companyPhone: string;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  logo: string | null;
  subtotal: number;
  totalTax: number;
  total: number;
};

const statusConfig = {
  paid: { label: "Paid", className: "bg-primary/20 text-primary" },
  pending: { label: "Pending", className: "bg-chart-4/20 text-chart-4" },
  issued: { label: "Issued", className: "bg-chart-3/20 text-chart-3" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const invoiceId = params?.id as string;
    if (!invoiceId) return;

    // Load invoice from localStorage
    const emittedInvoices = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    const draftInvoices = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );

    const allInvoices = [...emittedInvoices, ...draftInvoices];
    const foundInvoice = allInvoices.find(
      (inv: Invoice) => inv.id.toString() === invoiceId.toString()
    );

    if (foundInvoice) {
      setInvoice(foundInvoice);
    } else {
      toast({
        title: "Invoice not found",
        description: "The invoice you're looking for doesn't exist.",
        variant: "destructive",
      });
      router.push("/invoices");
    }
    setLoading(false);
  }, [params?.id, router, toast]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Invoice not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.tax) / 100;
    return subtotal + taxAmount;
  };

  const subtotal =
    invoice.subtotal ??
    invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  const totalTax =
    invoice.totalTax ??
    invoice.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * item.tax) / 100;
    }, 0);
  const total = invoice.total ?? subtotal + totalTax;

  // PDF/Print function similar to reference code
  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow popups for this site to print invoices.",
        variant: "destructive",
      });
      return;
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (text: string) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    // Format currency
    const formatCurrency = (amount: number) => {
      return `$${amount.toFixed(2)}`;
    };

    // Build logo HTML
    const logoHtml = invoice.logo
      ? `<img src="${invoice.logo}" alt="Company Logo" style="height: 180px; max-width: 300px; object-fit: contain;" />`
      : "";

    // Build company info HTML
    const companyInfoHtml = `
      <div style="text-align: right; margin-left: 20px; font-size: 12px;">
        <h1 style="margin: 0; font-size: 22px; color: #000; font-weight: bold;">
          ${escapeHtml(invoice.companyName || "Company Name")}
        </h1>
        ${
          invoice.companyAddress
            ? `<div class="info-line">${escapeHtml(
                invoice.companyAddress
              )}</div>`
            : ""
        }
        ${
          invoice.companyEmail && invoice.companyPhone
            ? `<div class="info-line">${escapeHtml(
                invoice.companyEmail
              )} | Phone ${escapeHtml(invoice.companyPhone)}</div>`
            : invoice.companyEmail
            ? `<div class="info-line">${escapeHtml(invoice.companyEmail)}</div>`
            : invoice.companyPhone
            ? `<div class="info-line">Phone ${escapeHtml(
                invoice.companyPhone
              )}</div>`
            : ""
        }
        ${
          invoice.companyNIT
            ? `<div class="info-line">NIT: ${escapeHtml(
                invoice.companyNIT
              )}</div>`
            : ""
        }
      </div>
    `;

    // Build items table rows
    const itemsRowsHtml = invoice.items
      .map(
        (item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${escapeHtml(item.description || "")}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align: right;">${formatCurrency(
          item.unitPrice * item.quantity
        )}</td>
      </tr>
    `
      )
      .join("");

    // Build the complete HTML document
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      padding: 0;
      font-size: 12px;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
    }
    .info-line {
      margin: 2px 0;
    }
    hr {
      border: none;
      border-top: 1px solid black;
      margin: 20px 0;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    table, th, td {
      border: 1px solid black;
    }
    th, td {
      padding: 6px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .totals {
      text-align: right;
      margin-top: 10px;
      font-size: 12px;
    }
    .totals p {
      margin: 5px 0;
    }
    .remarks {
      margin-top: 30px;
      font-size: 10px;
      text-align: justify;
      border-top: 1px solid black;
      padding-top: 10px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      z-index: -1;
      pointer-events: none;
      opacity: 0.1;
      font-size: 120px;
      color: #cccccc;
      font-weight: bold;
      white-space: nowrap;
    }
    @media print {
      body {
        margin: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Watermark -->
  <div class="watermark">${escapeHtml(invoice.companyName || "INVOICE")}</div>

  <!-- Header with logo and company info -->
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; z-index: 1;">
    ${logoHtml}
    ${companyInfoHtml}
  </div>

  <hr />

  <!-- Invoice and Client Details -->
  <div class="invoice-details">
    <div>
      <div class="section-title">BILLED TO:</div>
      <div><strong>NAME:</strong> ${escapeHtml(invoice.clientName || "")}</div>
      ${
        invoice.clientAddress
          ? `<div><strong>ADDRESS:</strong> ${escapeHtml(
              invoice.clientAddress
            )}</div>`
          : ""
      }
      ${
        invoice.clientPhone
          ? `<div><strong>PHONE:</strong> ${escapeHtml(
              invoice.clientPhone
            )}</div>`
          : ""
      }
      ${
        invoice.clientEmail
          ? `<div><strong>EMAIL:</strong> ${escapeHtml(
              invoice.clientEmail
            )}</div>`
          : ""
      }
    </div>
    <div style="text-align: right;">
      <div><strong>INVOICE No:</strong> ${escapeHtml(
        invoice.invoiceNumber
      )}</div>
      <div><strong>INVOICE date:</strong> ${escapeHtml(invoice.issueDate)}</div>
      <div><strong>INVOICE due date:</strong> ${escapeHtml(
        invoice.dueDate
      )}</div>
      ${
        invoice.notes
          ? `<div><strong>MESSAGE:</strong> ${escapeHtml(invoice.notes)}</div>`
          : ""
      }
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th>ITEM</th>
        <th>DESCRIPTION</th>
        <th>QTY</th>
        <th>PRICE PER UNIT</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRowsHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <p><strong>Sub total:</strong> ${formatCurrency(subtotal)}</p>
    <p><strong>Tax:</strong> ${formatCurrency(totalTax)}</p>
    <p><strong>Invoice total:</strong> ${formatCurrency(total)}</p>
  </div>

  <!-- Remarks and Terms -->
  ${
    invoice.notes || invoice.terms
      ? `
  <div class="remarks">
    ${
      invoice.notes
        ? `<p><strong>REMARKS:</strong> ${escapeHtml(invoice.notes)}</p>`
        : ""
    }
    ${invoice.terms ? `<p>${escapeHtml(invoice.terms)}</p>` : ""}
  </div>
  `
      : ""
  }
</body>
</html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

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
                <h1 className="text-3xl font-bold text-foreground">
                  {invoice.invoiceNumber}
                </h1>
                <Badge
                  className={
                    statusConfig[invoice.status as keyof typeof statusConfig]
                      ?.className || "bg-muted text-muted-foreground"
                  }
                >
                  {statusConfig[invoice.status as keyof typeof statusConfig]
                    ?.label || invoice.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Invoice details and information
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="icon" className="bg-transparent">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive bg-transparent"
            >
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
                {invoice.logo ? (
                  <img
                    src={invoice.logo}
                    alt="Company Logo"
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <Image
                    src="/images/adstrategic-icon.png"
                    alt="Company Logo"
                    width={64}
                    height={64}
                    className="h-16 w-16"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {invoice.companyName}
                  </h2>
                  {invoice.companyAddress && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.companyAddress}
                    </p>
                  )}
                  {invoice.companyNIT && (
                    <p className="text-sm text-muted-foreground">
                      NIT: {invoice.companyNIT}
                    </p>
                  )}
                  {invoice.companyEmail && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.companyEmail}
                    </p>
                  )}
                  {invoice.companyPhone && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.companyPhone}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-primary">INVOICE</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold">Invoice #:</span>{" "}
                  {invoice.invoiceNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Issue Date:</span>{" "}
                  {invoice.issueDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Due Date:</span>{" "}
                  {invoice.dueDate}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Bill To */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                BILL TO:
              </h4>
              <p className="font-semibold text-foreground">
                {invoice.clientName}
              </p>
              {invoice.clientAddress && (
                <p className="text-sm text-muted-foreground mt-1">
                  {invoice.clientAddress}
                </p>
              )}
              {invoice.clientPhone && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientPhone}
                </p>
              )}
              {invoice.clientEmail && (
                <p className="text-sm text-muted-foreground">
                  {invoice.clientEmail}
                </p>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-foreground">
                      Description
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Qty
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Unit Price
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Tax
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3 text-sm text-foreground">
                        {item.description}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        {item.tax}%
                      </td>
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
                  <span className="font-semibold text-foreground">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold text-foreground">
                    ${totalTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {invoice.notes && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Notes:
                </h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {invoice.terms && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Terms & Conditions:
                </h4>
                <p className="text-sm text-muted-foreground">{invoice.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoiceId={invoice.id.toString()}
        clientName={invoice.clientName}
      />
    </AppLayout>
  );
}
