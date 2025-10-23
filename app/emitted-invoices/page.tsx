"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreVertical, Eye, FileDown, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

type EmittedInvoice = {
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
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    tax: number
  }>
  notes: string
  terms: string
  logo: string | null
  subtotal: number
  totalTax: number
  total: number
  emittedAt: string
}

export default function EmittedInvoicesPage() {
  const [invoices, setInvoices] = useState<EmittedInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<EmittedInvoice[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<EmittedInvoice | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [searchQuery, statusFilter, invoices])

  const loadInvoices = () => {
    const saved = localStorage.getItem("emittedInvoices")
    if (saved) {
      const parsed = JSON.parse(saved)
      setInvoices(parsed)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.status.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const handleStatusChange = (invoiceId: number, newStatus: string) => {
    const updated = invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    setInvoices(updated)
    localStorage.setItem("emittedInvoices", JSON.stringify(updated))
    toast({
      title: "Status updated",
      description: `Invoice status changed to ${newStatus}`,
    })
  }

  const handleDelete = (invoiceId: number) => {
    setInvoiceToDelete(invoiceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (invoiceToDelete) {
      const updated = invoices.filter((inv) => inv.id !== invoiceToDelete)
      setInvoices(updated)
      localStorage.setItem("emittedInvoices", JSON.stringify(updated))
      toast({
        title: "Invoice deleted",
        description: "The emitted invoice has been removed",
      })
    }
    setDeleteDialogOpen(false)
    setInvoiceToDelete(null)
  }

  const handleView = (invoice: EmittedInvoice) => {
    setSelectedInvoice(invoice)
    setViewDialogOpen(true)
  }

  const handleDownload = async (invoice: EmittedInvoice) => {
    const previewElement = document.getElementById(`invoice-preview-${invoice.id}`)
    if (!previewElement) return

    try {
      const canvas = await html2canvas(previewElement, {
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
      pdf.save(`Invoice-${invoice.clientName}-${invoice.issueDate}.pdf`)

      toast({
        title: "PDF downloaded",
        description: "Invoice has been exported successfully",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the invoice",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    }
  }

  const calculateItemTotal = (item: EmittedInvoice["items"][0]) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return subtotal + taxAmount
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Emitted Invoices</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View and manage all sent invoices</p>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, client, or status..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No emitted invoices found</p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-6">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{invoice.invoiceNumber}</h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              {invoice.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{invoice.clientName}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Issued:</span>
                          <span className="ml-1 text-foreground">{invoice.issueDate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Due:</span>
                          <span className="ml-1 text-foreground">{invoice.dueDate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-1 font-semibold text-foreground">${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "paid")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "pending")}>
                          <Clock className="h-4 w-4 mr-2" />
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(invoice.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>

                {/* Hidden preview for PDF generation */}
                <div id={`invoice-preview-${invoice.id}`} className="fixed -left-[9999px] w-[210mm] bg-white p-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        {invoice.logo && (
                          <img src={invoice.logo || "/placeholder.svg"} alt="Company Logo" className="h-16 mb-4" />
                        )}
                        <h1 className="text-3xl font-bold text-gray-900">{invoice.companyName}</h1>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.companyAddress}</p>
                        <p className="text-sm text-gray-600">NIT: {invoice.companyNIT}</p>
                        <p className="text-sm text-gray-600">{invoice.companyEmail}</p>
                        <p className="text-sm text-gray-600">{invoice.companyPhone}</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                        <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600 mt-2">Issue Date: {invoice.issueDate}</p>
                        <p className="text-sm text-gray-600">Due Date: {invoice.dueDate}</p>
                      </div>
                    </div>

                    <div className="border-t border-b border-gray-300 py-4">
                      <p className="text-sm font-semibold text-gray-900">Bill To:</p>
                      <p className="text-sm text-gray-900">{invoice.clientName}</p>
                    </div>

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
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="py-2 text-sm text-gray-900">{item.description}</td>
                            <td className="text-right py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="text-right py-2 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                            <td className="text-right py-2 text-sm text-gray-900">{item.tax}%</td>
                            <td className="text-right py-2 text-sm text-gray-900">
                              ${calculateItemTotal(item).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Tax:</span>
                          <span className="font-semibold text-gray-900">${invoice.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-gray-900">${invoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {invoice.notes && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-gray-900">Notes:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-900">Terms & Conditions:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{selectedInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${selectedInvoice.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p>{selectedInvoice.issueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p>{selectedInvoice.dueDate}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="font-semibold">${calculateItemTotal(item).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this emitted invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
