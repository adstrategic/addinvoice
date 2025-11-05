"use client";

import type React from "react";

import { AppLayout } from "@/components/app-layout";
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
  Upload,
  Save,
  Send,
  FileDown,
  ArrowLeft,
  CheckCircle2,
  BookmarkPlus,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TemplateSelectionDialog } from "@/components/template-selection-dialog";

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
};

type QuoteDraft = {
  id: number;
  quoteNumber: string;
  status: string;
  issueDate: string;
  validUntil: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientPhone?: string;
  companyName: string;
  companyAddress: string;
  companyNIT: string;
  companyEmail: string;
  companyPhone: string;
  items: QuoteItem[];
  notes: string;
  terms: string;
  logo: string | null;
  subtotal: number;
  totalTax: number;
  total: number;
  createdAt: string;
};

type Client = {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  phone?: string;
};

type CompanyTemplate = {
  id: number;
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  logo: string | null;
  template: string;
  isDefault: boolean;
};

export default function NewQuotePage() {
  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, tax: 0 },
  ]);
  const [logo, setLogo] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotePreviewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [quoteNumber, setQuoteNumber] = useState("QUO-001");
  const [status, setStatus] = useState("draft");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [companyName, setCompanyName] = useState("ADSTRATEGIC");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyNIT, setCompanyNIT] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  useEffect(() => {
    // Load clients from existing invoices and quotes
    const loadClients = () => {
      const emittedInvoices = JSON.parse(
        localStorage.getItem("emittedInvoices") || "[]"
      );
      const draftInvoices = JSON.parse(
        localStorage.getItem("invoiceDrafts") || "[]"
      );
      const emittedQuotes = JSON.parse(
        localStorage.getItem("emittedQuotes") || "[]"
      );
      const draftQuotes = JSON.parse(
        localStorage.getItem("quoteDrafts") || "[]"
      );
      const allDocuments = [...emittedInvoices, ...draftInvoices, ...emittedQuotes, ...draftQuotes];

      // Extract unique clients
      const clientMap = new Map<string, Client>();

      allDocuments.forEach((doc: any) => {
        if (doc.clientName) {
          const key = doc.clientName.toLowerCase();
          if (!clientMap.has(key)) {
            clientMap.set(key, {
              name: doc.clientName,
              contact: doc.clientContact || "",
              email: doc.clientEmail || "",
              address: doc.clientAddress || "",
              phone: doc.clientPhone || "",
            });
          } else {
            // Merge data if we have more complete info
            const existing = clientMap.get(key)!;
            if (!existing.email && doc.clientEmail)
              existing.email = doc.clientEmail;
            if (!existing.address && doc.clientAddress)
              existing.address = doc.clientAddress;
            if (!existing.phone && doc.clientPhone)
              existing.phone = doc.clientPhone;
            if (!existing.contact && doc.clientContact)
              existing.contact = doc.clientContact;
          }
        }
      });

      setAvailableClients(Array.from(clientMap.values()));
    };

    loadClients();

    const editingDraft = localStorage.getItem("editingQuoteDraft");
    if (editingDraft) {
      const draft: QuoteDraft = JSON.parse(editingDraft);
      setEditingDraftId(draft.id);
      setQuoteNumber(draft.quoteNumber);
      setStatus(draft.status);
      setIssueDate(draft.issueDate);
      setValidUntil(draft.validUntil);
      setClientName(draft.clientName);
      setClientContact(draft.clientContact || "");
      setClientEmail(draft.clientEmail || "");
      setClientAddress(draft.clientAddress || "");
      setClientPhone(draft.clientPhone || "");
      setCompanyName(draft.companyName);
      setCompanyAddress(draft.companyAddress);
      setCompanyNIT(draft.companyNIT);
      setCompanyEmail(draft.companyEmail);
      setCompanyPhone(draft.companyPhone);
      setItems(draft.items);
      setNotes(draft.notes);
      setTerms(draft.terms);
      setLogo(draft.logo);
      localStorage.removeItem("editingQuoteDraft");
    } else {
      setShowTemplateDialog(true);
    }
  }, []);

  const handleTemplateSelect = (template: CompanyTemplate | null) => {
    if (template) {
      setCompanyName(template.name);
      setCompanyAddress(template.address);
      setCompanyNIT(template.nit);
      setCompanyEmail(template.email);
      setCompanyPhone(template.phone);
      setLogo(template.logo);

      const savedInvoiceConfig = localStorage.getItem("invoiceConfig");
      if (savedInvoiceConfig) {
        const config = JSON.parse(savedInvoiceConfig);
        if (config.reminderMessage) {
          setTerms(
            "This quote is valid for 30 days. Terms and conditions apply."
          );
        }
      }

      toast({
        title: "Template loaded",
        description: `Company information from ${template.name} has been applied`,
      });
    }
    setShowTemplateDialog(false);
  };

  const handleSaveAsTemplate = () => {
    setShowSaveTemplateDialog(true);
  };

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: CompanyTemplate = {
      id: Date.now(),
      name: templateName,
      nit: companyNIT,
      address: companyAddress,
      email: companyEmail,
      phone: companyPhone,
      logo: logo,
      template: "custom",
      isDefault: false,
    };

    const existingCompanies = JSON.parse(
      localStorage.getItem("companies") || "[]"
    );
    localStorage.setItem(
      "companies",
      JSON.stringify([...existingCompanies, newTemplate])
    );

    toast({
      title: "Template saved",
      description: `${templateName} has been saved as a template`,
    });

    setShowSaveTemplateDialog(false);
    setTemplateName("");
  };

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
    field: keyof QuoteItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: QuoteItem) => {
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
      quoteNumber,
      status,
      issueDate,
      validUntil,
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
      localStorage.getItem("quoteDrafts") || "[]"
    );

    let updatedDrafts;
    if (editingDraftId) {
      updatedDrafts = existingDrafts.map((d: QuoteDraft) =>
        d.id === editingDraftId ? draftData : d
      );
    } else {
      updatedDrafts = [...existingDrafts, draftData];
      setEditingDraftId(draftData.id);
    }

    localStorage.setItem("quoteDrafts", JSON.stringify(updatedDrafts));

    setShowDraftDialog(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        toast({
          title: "Logo uploaded",
          description: "Your company logo has been added to the quote.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPDF = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow popups for this site to print quotes.",
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
    const quoteHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Quote ${escapeHtml(quoteNumber)}</title>
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
    .quote-details {
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
  <div class="watermark">${escapeHtml(companyName || "QUOTE")}</div>

  <!-- Header with logo and company info -->
  <div class="header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; z-index: 1;">
    ${logoHtml}
    ${companyInfoHtml}
  </div>

  <hr />

  <!-- Quote and Client Details -->
  <div class="quote-details">
    <div>
      <div class="section-title">QUOTE FOR:</div>
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
      <div><strong>QUOTE No:</strong> ${escapeHtml(quoteNumber)}</div>
      <div><strong>QUOTE date:</strong> ${escapeHtml(issueDate)}</div>
      <div><strong>Valid until:</strong> ${escapeHtml(validUntil)}</div>
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
    <p><strong>Estimated total:</strong> ${formatCurrency(total)}</p>
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

    printWindow.document.write(quoteHTML);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
      }, 250);
    };
  };

  const handleSendQuote = () => {
    setShowSendDialog(true);
  };

  const confirmSendQuote = () => {
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

    const emittedQuoteData = {
      id: Date.now(),
      quoteNumber,
      status: "sent",
      issueDate,
      validUntil,
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
      sentAt: new Date().toISOString(),
    };

    const existingEmitted = JSON.parse(
      localStorage.getItem("emittedQuotes") || "[]"
    );
    localStorage.setItem(
      "emittedQuotes",
      JSON.stringify([...existingEmitted, emittedQuoteData])
    );

    if (editingDraftId) {
      const existingDrafts = JSON.parse(
        localStorage.getItem("quoteDrafts") || "[]"
      );
      const updatedDrafts = existingDrafts.filter(
        (d: QuoteDraft) => d.id !== editingDraftId
      );
      localStorage.setItem("quoteDrafts", JSON.stringify(updatedDrafts));
    }

    setShowSendDialog(false);
    setShowSuccessDialog(true);

    setTimeout(() => {
      setShowSuccessDialog(false);
      setQuoteNumber("QUO-002");
      setClientName("");
      setClientContact("");
      setClientEmail("");
      setClientAddress("");
      setClientPhone("");
      setSelectedClientId("");
      setItems([
        { id: "1", description: "", quantity: 1, unitPrice: 0, tax: 0 },
      ]);
      setNotes("");
      setTerms("");
      setLogo(null);
      setEditingDraftId(null);
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/quotes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create Quote
              </h1>
              <p className="text-muted-foreground mt-1">
                Fill in the details to create a new quote or estimate
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveAsTemplate}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <BookmarkPlus className="h-4 w-4" />
              Save as Template
            </Button>
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
            <Button onClick={handleSendQuote} className="gap-2">
              <Send className="h-4 w-4" />
              Send Quote
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Information Sidebar */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                >
                  {logo ? (
                    <img
                      src={logo || "/placeholder.svg"}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload logo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    placeholder="ADSTRATEGIC"
                    className="mt-1"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    placeholder="123 Business St, City, Country"
                    className="mt-1"
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label>NIT / Tax ID</Label>
                  <Input
                    placeholder="123456789-0"
                    className="mt-1"
                    value={companyNIT}
                    onChange={(e) => setCompanyNIT(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@adstrategic.com"
                    className="mt-1"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Header */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Quote Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Quote Number</Label>
                    <Input
                      placeholder="QUO-001"
                      className="mt-1"
                      value={quoteNumber}
                      onChange={(e) => setQuoteNumber(e.target.value)}
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
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
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
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
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
                  <Label>Quote Existing Client</Label>
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
                      No previous clients found. Fill in the fields below to
                      create a new client.
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

            {/* Quote Items */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground">
                    Services / Products
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
                    <span className="font-bold text-foreground">Estimated Total:</span>
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
                    placeholder="Quote validity, terms, conditions, etc..."
                    className="mt-1"
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onSelect={handleTemplateSelect}
        onOpenChange={setShowTemplateDialog}
      />

      <Dialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the current company information as a reusable template for
              future quotes
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g., My Company Template"
              className="mt-2"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Existing dialogs */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this quote to{" "}
              {clientName || "the client"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSendQuote}>Confirm & Send</Button>
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
              Quote Sent Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your quote has been sent to the client. The form will be reset.
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
              Your quote draft has been saved. You can access it later.
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
    </AppLayout>
  );
}

