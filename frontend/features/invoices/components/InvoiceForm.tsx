"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  Send,
  FileDown,
  ArrowLeft,
  CheckCircle2,
  User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Business } from "../hooks/useBusinessSelection";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
};

type Client = {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  phone?: string;
};

interface InvoiceFormProps {
  selectedBusiness: Business;
  onCancel: () => void;
}

export function InvoiceForm({ selectedBusiness, onCancel }: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, tax: 0 },
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [invoiceNumber, setInvoiceNumber] = useState("INV-007");
  const [status, setStatus] = useState("draft");
  const [issueDate, setIssueDate] = useState("2025-01-21");
  const [dueDate, setDueDate] = useState("2025-02-21");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  // Set company data from selected business
  const companyName = selectedBusiness.name;
  const companyAddress = selectedBusiness.address;
  const companyNIT = selectedBusiness.nit;
  const companyEmail = selectedBusiness.email;
  const companyPhone = selectedBusiness.phone;
  const logo = selectedBusiness.logo;

  useEffect(() => {
    // Load clients from existing invoices
    const loadClients = () => {
      const emittedInvoices = JSON.parse(
        localStorage.getItem("emittedInvoices") || "[]"
      );
      const draftInvoices = JSON.parse(
        localStorage.getItem("invoiceDrafts") || "[]"
      );
      const allInvoices = [...emittedInvoices, ...draftInvoices];

      // Extract unique clients
      const clientMap = new Map<string, Client>();

      allInvoices.forEach((invoice: any) => {
        if (invoice.clientName) {
          const key = invoice.clientName.toLowerCase();
          if (!clientMap.has(key)) {
            clientMap.set(key, {
              name: invoice.clientName,
              contact: invoice.clientContact || "",
              email: invoice.clientEmail || "",
              address: invoice.clientAddress || "",
              phone: invoice.clientPhone || "",
            });
          } else {
            // Merge data if we have more complete info
            const existing = clientMap.get(key)!;
            if (!existing.email && invoice.clientEmail)
              existing.email = invoice.clientEmail;
            if (!existing.address && invoice.clientAddress)
              existing.address = invoice.clientAddress;
            if (!existing.phone && invoice.clientPhone)
              existing.phone = invoice.clientPhone;
            if (!existing.contact && invoice.clientContact)
              existing.contact = invoice.clientContact;
          }
        }
      });

      setAvailableClients(Array.from(clientMap.values()));
    };

    loadClients();

    // Load terms from config if available
    const savedInvoiceConfig = localStorage.getItem("invoiceConfig");
    if (savedInvoiceConfig) {
      const config = JSON.parse(savedInvoiceConfig);
      if (config.reminderMessage) {
        setTerms(
          "Payment is due within 30 days. Late payments may incur additional fees."
        );
      }
    }
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        tax: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.tax) / 100;
    return subtotal + taxAmount;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + (subtotal * item.tax) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleClientSelect = (clientName: string) => {
    const client = availableClients.find((c) => c.name === clientName);
    if (client) {
      setClientName(client.name);
      setClientContact(client.contact || "");
      setClientEmail(client.email || "");
      setClientAddress(client.address || "");
      setClientPhone(client.phone || "");
      setSelectedClientId(clientName);
      toast({
        title: "Client selected",
        description: `Client information for ${client.name} has been filled.`,
      });
    }
  };

  // Helper function to save/update client in localStorage
  const saveClientToStorage = (clientData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact?: string;
  }) => {
    if (!clientData.name.trim()) return;

    const existingClients = JSON.parse(localStorage.getItem("clients") || "[]");

    // Check if client already exists (case-insensitive)
    const existingIndex = existingClients.findIndex(
      (c: any) => c.name.toLowerCase() === clientData.name.toLowerCase()
    );

    const clientToSave = {
      id:
        existingIndex >= 0
          ? existingClients[existingIndex].id
          : Date.now().toString(),
      name: clientData.name,
      email: clientData.email || "",
      phone: clientData.phone || "",
      address: clientData.address || "",
      contact: clientData.contact || "",
      status: "active",
      createdAt:
        existingIndex >= 0
          ? existingClients[existingIndex].createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing client (merge data, keep what exists if new data is empty)
      existingClients[existingIndex] = {
        ...existingClients[existingIndex],
        ...clientToSave,
        email: clientData.email || existingClients[existingIndex].email || "",
        phone: clientData.phone || existingClients[existingIndex].phone || "",
        address:
          clientData.address || existingClients[existingIndex].address || "",
        contact:
          clientData.contact || existingClients[existingIndex].contact || "",
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new client
      existingClients.push(clientToSave);
    }

    localStorage.setItem("clients", JSON.stringify(existingClients));
  };

  const handleSaveDraft = () => {
    // Save client if we have client name
    if (clientName.trim()) {
      saveClientToStorage({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        contact: clientContact,
      });
    }

    const draftData = {
      id: editingDraftId || Date.now(),
      invoiceNumber,
      status,
      issueDate,
      dueDate,
      clientName,
      clientContact: clientContact || undefined,
      clientEmail: clientEmail || undefined,
      clientAddress: clientAddress || undefined,
      clientPhone: clientPhone || undefined,
      companyName,
      companyAddress,
      companyNIT,
      companyEmail,
      companyPhone,
      items,
      notes,
      terms,
      logo,
      subtotal: calculateSubtotal(),
      totalTax: calculateTotalTax(),
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
    };

    const existingDrafts = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );

    let updatedDrafts;
    if (editingDraftId) {
      updatedDrafts = existingDrafts.map((d: any) =>
        d.id === editingDraftId ? draftData : d
      );
    } else {
      updatedDrafts = [...existingDrafts, draftData];
      setEditingDraftId(draftData.id);
    }

    localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts));

    setShowDraftDialog(true);
  };

  const handleExportPDF = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow popups for this site to print invoices.",
        variant: "destructive",
      });
      setIsExporting(false);
      return;
    }

    setIsExporting(true);

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
    const logoHtml = logo
      ? `<img src="${logo}" alt="Company Logo" style="height: 180px; max-width: 300px; object-fit: contain;" />`
      : "";

    // Build company info HTML
    const companyInfoHtml = `
      <div style="text-align: right; margin-left: 20px; font-size: 12px;">
                 <h1 style="margin: 0; font-size: 22px; color: #000; font-weight: bold;">
          ${escapeHtml(companyName || "Company Name")}
        </h1>
        ${
          companyAddress
            ? `<div class="info-line">${escapeHtml(companyAddress)}</div>`
            : ""
        }
        ${
          companyEmail && companyPhone
            ? `<div class="info-line">${escapeHtml(
                companyEmail
              )} | Phone ${escapeHtml(companyPhone)}</div>`
            : companyEmail
            ? `<div class="info-line">${escapeHtml(companyEmail)}</div>`
            : companyPhone
            ? `<div class="info-line">Phone ${escapeHtml(companyPhone)}</div>`
            : ""
        }
        ${
          companyNIT
            ? `<div class="info-line">NIT: ${escapeHtml(companyNIT)}</div>`
            : ""
        }
      </div>
    `;

    // Build items table rows
    const itemsRowsHtml = items
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

    const subtotal = calculateSubtotal();
    const totalTax = calculateTotalTax();
    const total = calculateTotal();

    // Build the complete HTML document
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>
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
  <div class="watermark">${escapeHtml(companyName || "INVOICE")}</div>

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
      <div><strong>NAME:</strong> ${escapeHtml(clientName || "")}</div>
      ${
        clientAddress
          ? `<div><strong>ADDRESS:</strong> ${escapeHtml(clientAddress)}</div>`
          : ""
      }
      ${
        clientPhone
          ? `<div><strong>PHONE:</strong> ${escapeHtml(clientPhone)}</div>`
          : ""
      }
      ${
        clientEmail
          ? `<div><strong>EMAIL:</strong> ${escapeHtml(clientEmail)}</div>`
          : ""
      }
      ${
        clientContact
          ? `<div><strong>CONTACT:</strong> ${escapeHtml(clientContact)}</div>`
          : ""
      }
    </div>
    <div style="text-align: right;">
      <div><strong>INVOICE No:</strong> ${escapeHtml(invoiceNumber)}</div>
      <div><strong>INVOICE date:</strong> ${escapeHtml(issueDate)}</div>
      <div><strong>INVOICE due date:</strong> ${escapeHtml(dueDate)}</div>
      ${
        notes ? `<div><strong>MESSAGE:</strong> ${escapeHtml(notes)}</div>` : ""
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
    notes || terms
      ? `
  <div class="remarks">
    ${notes ? `<p><strong>REMARKS:</strong> ${escapeHtml(notes)}</p>` : ""}
    ${terms ? `<p>${escapeHtml(terms)}</p>` : ""}
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
        setIsExporting(false);
      }, 250);
    };
  };

  const handleSendInvoice = () => {
    setShowSendDialog(true);
  };

  const confirmSendInvoice = () => {
    // Save client if we have client name
    if (clientName.trim()) {
      saveClientToStorage({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        contact: clientContact,
      });
    }

    const emittedInvoiceData = {
      id: Date.now(),
      invoiceNumber,
      status: "issued",
      issueDate,
      dueDate,
      clientName,
      clientContact: clientContact || undefined,
      clientEmail: clientEmail || undefined,
      clientAddress: clientAddress || undefined,
      clientPhone: clientPhone || undefined,
      companyName,
      companyAddress,
      companyNIT,
      companyEmail,
      companyPhone,
      items,
      notes,
      terms,
      logo,
      subtotal: calculateSubtotal(),
      totalTax: calculateTotalTax(),
      total: calculateTotal(),
      emittedAt: new Date().toISOString(),
    };

    const existingEmitted = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    localStorage.setItem(
      "emittedInvoices",
      JSON.stringify([...existingEmitted, emittedInvoiceData])
    );

    if (editingDraftId) {
      const existingDrafts = JSON.parse(
        localStorage.getItem("invoiceDrafts") || "[]"
      );
      const updatedDrafts = existingDrafts.filter(
        (d: any) => d.id !== editingDraftId
      );
      localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts));
    }

    setShowSendDialog(false);
    setShowSuccessDialog(true);

    setTimeout(() => {
      setShowSuccessDialog(false);
      onCancel(); // Go back to list
    }, 2000);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Create Invoice
            </h1>
            <p className="text-muted-foreground mt-1">
              Fill in the details to create a new invoice
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            className="gap-2 bg-transparent"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            variant="outline"
            className="gap-2 bg-transparent"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button onClick={handleSendInvoice} className="gap-2">
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice Header */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Invoice Number</Label>
                <Input
                  placeholder="INV-001"
                  className="mt-1"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Invoice Existing Client</Label>
              <Select
                value={selectedClientId}
                onValueChange={handleClientSelect}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an existing client" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.length > 0 ? (
                    availableClients.map((client) => (
                      <SelectItem key={client.name} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No clients found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableClients.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No previous clients found. Fill in the fields below to create
                  a new client.
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Client Name *</Label>
                <Input
                  placeholder="Enter client name"
                  className="mt-1"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setSelectedClientId("");
                  }}
                />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input
                  placeholder="Enter contact name"
                  className="mt-1"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="client@example.com"
                className="mt-1"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                placeholder="Enter client address"
                className="mt-1"
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="mt-1"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground">
                Items / Services
              </CardTitle>
              <Button
                onClick={addItem}
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Product or service description"
                        className="mt-1"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          className="mt-1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="mt-1"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tax (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className="mt-1"
                          value={item.tax}
                          onChange={(e) =>
                            updateItem(index, "tax", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <div className="mt-1 h-10 flex items-center px-3 rounded-md bg-muted text-foreground font-semibold">
                          ${calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground">
                  ${calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tax:</span>
                <span className="font-semibold text-foreground">
                  ${calculateTotalTax().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-border">
                <span className="font-bold text-foreground">Total:</span>
                <span className="font-bold text-primary">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any additional notes or comments..."
                className="mt-1"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                placeholder="Payment terms, late fees, etc..."
                className="mt-1"
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden preview for PDF export */}
      <div
        ref={invoicePreviewRef}
        className="fixed -left-[9999px] w-[210mm] bg-white p-8"
      >
        <div className="space-y-6">
          {/* Header with logo */}
          <div className="flex justify-between items-start">
            <div>
              {logo && (
                <img
                  src={logo || "/placeholder.svg"}
                  alt="Company Logo"
                  className="h-16 mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {companyName}
              </h1>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {companyAddress}
              </p>
              <p className="text-sm text-gray-600">NIT: {companyNIT}</p>
              <p className="text-sm text-gray-600">{companyEmail}</p>
              <p className="text-sm text-gray-600">{companyPhone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-sm text-gray-600">#{invoiceNumber}</p>
              <p className="text-sm text-gray-600 mt-2">
                Issue Date: {issueDate}
              </p>
              <p className="text-sm text-gray-600">Due Date: {dueDate}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="border-t border-b border-gray-300 py-4">
            <p className="text-sm font-semibold text-gray-900">Bill To:</p>
            <p className="text-sm text-gray-900">{clientName}</p>
            {clientAddress && (
              <p className="text-sm text-gray-900">{clientAddress}</p>
            )}
            {clientPhone && (
              <p className="text-sm text-gray-900">{clientPhone}</p>
            )}
            {clientEmail && (
              <p className="text-sm text-gray-900">{clientEmail}</p>
            )}
            {clientContact && (
              <p className="text-sm text-gray-900">Contact: {clientContact}</p>
            )}
          </div>

          {/* Items table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Qty
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Price
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Tax
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    {item.tax}%
                  </td>
                  <td className="text-right py-2 text-sm text-gray-900">
                    ${calculateItemTotal(item).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  ${calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax:</span>
                <span className="font-semibold text-gray-900">
                  ${calculateTotalTax().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes and terms */}
          {notes && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Notes:</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {notes}
              </p>
            </div>
          )}
          {terms && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900">
                Terms & Conditions:
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {terms}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this invoice to{" "}
              {clientName || "the client"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSendInvoice}>Confirm & Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Invoice Sent Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your invoice has been sent to the client.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Draft Saved Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your invoice draft has been saved. You can access it from the
              Drafts page.
            </DialogDescription>
            <DialogFooter className="w-full">
              <Button
                onClick={() => setShowDraftDialog(false)}
                className="w-full"
              >
                Continue Editing
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
