"use client"

import type React from "react"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Upload, Save, Send, FileDown, ArrowLeft, CheckCircle2, BookmarkPlus } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { TemplateSelectionDialog } from "@/components/template-selection-dialog"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
}

type InvoiceDraft = {
  id: number
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  clientName: string
  companyName: string
  companyAddress: string
  companyNIT: string
  companyEmail: string
  companyPhone: string
  items: InvoiceItem[]
  notes: string
  terms: string
  logo: string | null
  subtotal: number
  totalTax: number
  total: number
  createdAt: string
}

type CompanyTemplate = {
  id: number
  name: string
  nit: string
  address: string
  email: string
  phone: string
  logo: string | null
  template: string
  isDefault: boolean
}

export default function NewInvoicePage() {
  const [items, setItems] = useState<InvoiceItem[]>([{ id: "1", description: "", quantity: 1, unitPrice: 0, tax: 0 }])
  const [logo, setLogo] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const invoicePreviewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [invoiceNumber, setInvoiceNumber] = useState("INV-007")
  const [status, setStatus] = useState("draft")
  const [issueDate, setIssueDate] = useState("2025-01-21")
  const [dueDate, setDueDate] = useState("2025-02-21")
  const [clientName, setClientName] = useState("")
  const [companyName, setCompanyName] = useState("ADSTRATEGIC")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyNIT, setCompanyNIT] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState("")
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null)

  useEffect(() => {
    const editingDraft = localStorage.getItem("editingDraft")
    if (editingDraft) {
      const draft: InvoiceDraft = JSON.parse(editingDraft)
      setEditingDraftId(draft.id)
      setInvoiceNumber(draft.invoiceNumber)
      setStatus(draft.status)
      setIssueDate(draft.issueDate)
      setDueDate(draft.dueDate)
      setClientName(draft.clientName)
      setCompanyName(draft.companyName)
      setCompanyAddress(draft.companyAddress)
      setCompanyNIT(draft.companyNIT)
      setCompanyEmail(draft.companyEmail)
      setCompanyPhone(draft.companyPhone)
      setItems(draft.items)
      setNotes(draft.notes)
      setTerms(draft.terms)
      setLogo(draft.logo)
      localStorage.removeItem("editingDraft")
    } else {
      setShowTemplateDialog(true)
    }
  }, [])

  const handleTemplateSelect = (template: CompanyTemplate | null) => {
    if (template) {
      setCompanyName(template.name)
      setCompanyAddress(template.address)
      setCompanyNIT(template.nit)
      setCompanyEmail(template.email)
      setCompanyPhone(template.phone)
      setLogo(template.logo)

      const savedInvoiceConfig = localStorage.getItem("invoiceConfig")
      if (savedInvoiceConfig) {
        const config = JSON.parse(savedInvoiceConfig)
        if (config.reminderMessage) {
          setTerms("Payment is due within 30 days. Late payments may incur additional fees.")
        }
      }

      toast({
        title: "Template loaded",
        description: `Company information from ${template.name} has been applied`,
      })
    }
    setShowTemplateDialog(false)
  }

  const handleSaveAsTemplate = () => {
    setShowSaveTemplateDialog(true)
  }

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template",
        variant: "destructive",
      })
      return
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
    }

    const existingCompanies = JSON.parse(localStorage.getItem("companies") || "[]")
    localStorage.setItem("companies", JSON.stringify([...existingCompanies, newTemplate]))

    toast({
      title: "Template saved",
      description: `${templateName} has been saved as a template`,
    })

    setShowSaveTemplateDialog(false)
    setTemplateName("")
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, tax: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice
      return sum + (subtotal * item.tax) / 100
    }, 0)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const handleSaveDraft = () => {
    const draftData = {
      id: editingDraftId || Date.now(),
      invoiceNumber,
      status,
      issueDate,
      dueDate,
      clientName,
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
    }

    const existingDrafts = JSON.parse(localStorage.getItem("invoiceDrafts") || "[]")

    let updatedDrafts
    if (editingDraftId) {
      updatedDrafts = existingDrafts.map((d: InvoiceDraft) => (d.id === editingDraftId ? draftData : d))
    } else {
      updatedDrafts = [...existingDrafts, draftData]
      setEditingDraftId(draftData.id)
    }

    localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts))

    setShowDraftDialog(true)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
        toast({
          title: "Logo uploaded",
          description: "Your company logo has been added to the invoice.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExportPDF = async () => {
    if (!invoicePreviewRef.current) return

    setIsExporting(true)
    try {
      const canvas = await html2canvas(invoicePreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`Invoice-${clientName || "Draft"}-${issueDate}.pdf`)

      toast({
        title: "PDF exported successfully",
        description: "Your invoice has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the PDF.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSendInvoice = () => {
    setShowSendDialog(true)
  }

  const confirmSendInvoice = () => {
    const emittedInvoiceData = {
      id: Date.now(),
      invoiceNumber,
      status: "issued",
      issueDate,
      dueDate,
      clientName,
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
    }

    const existingEmitted = JSON.parse(localStorage.getItem("emittedInvoices") || "[]")
    localStorage.setItem("emittedInvoices", JSON.stringify([...existingEmitted, emittedInvoiceData]))

    if (editingDraftId) {
      const existingDrafts = JSON.parse(localStorage.getItem("invoiceDrafts") || "[]")
      const updatedDrafts = existingDrafts.filter((d: InvoiceDraft) => d.id !== editingDraftId)
      localStorage.setItem("invoiceDrafts", JSON.stringify(updatedDrafts))
    }

    setShowSendDialog(false)
    setShowSuccessDialog(true)

    setTimeout(() => {
      setShowSuccessDialog(false)
      setInvoiceNumber("INV-008")
      setClientName("")
      setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, tax: 0 }])
      setNotes("")
      setTerms("")
      setLogo(null)
      setEditingDraftId(null)
    }, 2000)
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
              <p className="text-muted-foreground mt-1">Fill in the details to create a new invoice</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveAsTemplate} variant="outline" className="gap-2 bg-transparent">
              <BookmarkPlus className="h-4 w-4" />
              Save as Template
            </Button>
            <Button onClick={handleSaveDraft} variant="outline" className="gap-2 bg-transparent">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" className="gap-2 bg-transparent">
              <FileDown className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button onClick={handleSendInvoice} className="gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Information Sidebar */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Logo</Label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
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
                      <p className="text-sm text-muted-foreground">Click to upload logo</p>
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

          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Invoice Details</CardTitle>
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
                    <Input type="date" className="mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Client Name</Label>
                  <Input
                    placeholder="Enter client name"
                    className="mt-1"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground">Items / Services</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Product or service description"
                            className="mt-1"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
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
                              onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
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
                              onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
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
                              onChange={(e) => updateItem(index, "tax", Number(e.target.value))}
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
                    <span className="font-semibold text-foreground">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax:</span>
                    <span className="font-semibold text-foreground">${calculateTotalTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Additional Information</CardTitle>
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
        </div>

        <div ref={invoicePreviewRef} className="fixed -left-[9999px] w-[210mm] bg-white p-8">
          <div className="space-y-6">
            {/* Header with logo */}
            <div className="flex justify-between items-start">
              <div>
                {logo && <img src={logo || "/placeholder.svg"} alt="Company Logo" className="h-16 mb-4" />}
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                <p className="text-sm text-gray-600 whitespace-pre-line">{companyAddress}</p>
                <p className="text-sm text-gray-600">NIT: {companyNIT}</p>
                <p className="text-sm text-gray-600">{companyEmail}</p>
                <p className="text-sm text-gray-600">{companyPhone}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-sm text-gray-600">#{invoiceNumber}</p>
                <p className="text-sm text-gray-600 mt-2">Issue Date: {issueDate}</p>
                <p className="text-sm text-gray-600">Due Date: {dueDate}</p>
              </div>
            </div>

            {/* Client info */}
            <div className="border-t border-b border-gray-300 py-4">
              <p className="text-sm font-semibold text-gray-900">Bill To:</p>
              <p className="text-sm text-gray-900">{clientName}</p>
            </div>

            {/* Items table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 text-sm font-semibold text-gray-900">Description</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">Qty</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">Price</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">Tax</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 text-sm text-gray-900">{item.description}</td>
                    <td className="text-right py-2 text-sm text-gray-900">{item.quantity}</td>
                    <td className="text-right py-2 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-2 text-sm text-gray-900">{item.tax}%</td>
                    <td className="text-right py-2 text-sm text-gray-900">${calculateItemTotal(item).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-semibold text-gray-900">${calculateTotalTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes and terms */}
            {notes && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Notes:</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{notes}</p>
              </div>
            )}
            {terms && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900">Terms & Conditions:</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{terms}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onSelect={handleTemplateSelect}
        onOpenChange={setShowTemplateDialog}
      />

      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the current company information as a reusable template for future invoices
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
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
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
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this invoice to {clientName || "the client"}?
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
            <DialogTitle className="text-2xl font-bold text-center">Invoice Sent Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your invoice has been sent to the client. The form will be reset.
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
            <DialogTitle className="text-2xl font-bold text-center">Draft Saved Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your invoice draft has been saved. You can access it from the Drafts page.
            </DialogDescription>
            <DialogFooter className="w-full">
              <Button onClick={() => setShowDraftDialog(false)} className="w-full">
                Continue Editing
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
